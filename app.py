import os
from flask import Flask, render_template, request, send_file, jsonify, url_for
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF
from PIL import Image
import zipfile

app = Flask(__name__)

# ------------------------------
# Basic Config
# ------------------------------
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ------------------------------
# Routes
# ------------------------------
@app.route('/')
def home():
    """
    Renders the main index.html template.
    """
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    """
    Serves your favicon from static folder.
    """
    # If you have 'static/favicon.ico':
    return send_file(os.path.join(app.root_path, 'static', 'favicon.ico'))

# ========== PDF / Image Operations ==========
@app.route('/convert-image', methods=['POST'])
def convert_image():
    files = request.files.getlist('files[]')
    images = [Image.open(f) for f in files if allowed_file(f.filename)]

    if not images:
        return jsonify({"message": "No valid image files selected."}), 400

    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], 'output.pdf')
    images[0].save(pdf_path, save_all=True, append_images=images[1:])
    return send_file(pdf_path, as_attachment=True, download_name='converted.pdf')


@app.route('/compress-pdf', methods=['POST'])
def compress_pdf_route():
    file = request.files.get('pdf')
    compression_value = request.form.get('compression-level', '5')  # default = 5 (medium)

    if not file or not allowed_file(file.filename):
        return jsonify({"message": "Invalid or no PDF file provided."}), 400

    try:
        compression_int = int(compression_value)
    except ValueError:
        return jsonify({"message": "Invalid compression level."}), 400

    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
    file.save(pdf_path)
    doc = fitz.open(pdf_path)

    # Fit the range of set_compression(0..9)
    compression_int = min(max(compression_int, 0), 9)
    for page in doc:
        page.set_compression(compression_int)

    compressed_pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], 'compressed_' + secure_filename(file.filename))
    doc.save(compressed_pdf_path)
    doc.close()
    return send_file(compressed_pdf_path, as_attachment=True, download_name='compressed.pdf')


@app.route('/convert-pdf-to-image', methods=['POST'])
def convert_pdf_to_image():
    file = request.files.get('pdf')
    if not file or not allowed_file(file.filename):
        return jsonify({"message": "Invalid or no PDF file provided."}), 400

    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
    file.save(pdf_path)

    try:
        doc = fitz.open(pdf_path)
        image_files = []
        for i, page in enumerate(doc):
            pix = page.get_pixmap()
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], f'page_{i}.png')
            pix.save(image_path)
            image_files.append(image_path)
        doc.close()

        zip_path = os.path.join(app.config['UPLOAD_FOLDER'], 'images.zip')
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for image_file in image_files:
                zipf.write(image_file, os.path.basename(image_file))

        return send_file(zip_path, as_attachment=True, download_name='pages_images.zip')
    except Exception as e:
        return jsonify({"message": f"Error converting PDF: {str(e)}"}), 500


@app.route('/split-pdf', methods=['POST'])
def split_pdf():
    file = request.files.get('pdf')
    if not file or not allowed_file(file.filename):
        return jsonify({"message": "Invalid or no PDF file provided."}), 400

    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
    file.save(pdf_path)
    doc = fitz.open(pdf_path)
    zip_path = os.path.join(app.config['UPLOAD_FOLDER'], 'split_pages.zip')

    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for i in range(len(doc)):
            new_doc = fitz.open()
            new_doc.insert_pdf(doc, from_page=i, to_page=i)
            split_pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f'page_{i + 1}.pdf')
            new_doc.save(split_pdf_path)
            zipf.write(split_pdf_path, os.path.basename(split_pdf_path))
            new_doc.close()
    doc.close()
    return send_file(zip_path, as_attachment=True, download_name='split_pages.zip')


@app.route('/merge-pdf', methods=['POST'])
def merge_pdf():
    files = request.files.getlist('pdfs[]')
    valid_files = [f for f in files if allowed_file(f.filename)]

    if not valid_files:
        return jsonify({"message": "No valid PDF files selected."}), 400

    merged_pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], 'merged.pdf')
    merged_doc = fitz.open()

    for file in valid_files:
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
        file.save(pdf_path)
        doc = fitz.open(pdf_path)
        merged_doc.insert_pdf(doc)
        doc.close()

    merged_doc.save(merged_pdf_path)
    merged_doc.close()
    return send_file(merged_pdf_path, as_attachment=True, download_name='merged.pdf')


@app.route('/convert-pdf-to-text', methods=['POST'])
def convert_pdf_to_text():
    file = request.files.get('pdf')
    if not file or not allowed_file(file.filename):
        return jsonify({"message": "Invalid or no PDF file provided."}), 400

    try:
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
        file.save(pdf_path)
        doc = fitz.open(pdf_path)
        text = ""
        for page_num in range(len(doc)):
            page = doc[page_num]
            text += f"\n--- Page {page_num + 1} ---\n"
            text += page.get_text("text")
            text += "\n"
        text_path = os.path.join(app.config['UPLOAD_FOLDER'], 'output.txt')
        with open(text_path, 'w', encoding='utf-8') as text_file:
            text_file.write(text)
        doc.close()

        filename_no_ext = os.path.splitext(file.filename)[0]
        return send_file(
            text_path,
            mimetype='text/plain',
            as_attachment=True,
            download_name=f"{filename_no_ext}.txt"
        )
    except Exception as e:
        return jsonify({"message": f"Error converting PDF: {str(e)}"}), 500


@app.route('/compress-image', methods=['POST'])
def compress_image():
    files = request.files.getlist('images[]')
    valid_images = [f for f in files if allowed_file(f.filename)]

    if not valid_images:
        return jsonify({"message": "No valid image files selected."}), 400

    compressed_images = []
    for file in valid_images:
        image = Image.open(file)
        compressed_image_path = os.path.join(
            app.config['UPLOAD_FOLDER'],
            'compressed_' + secure_filename(file.filename)
        )
        image.save(compressed_image_path, optimize=True, quality=85)
        compressed_images.append(compressed_image_path)

    zip_path = os.path.join(app.config['UPLOAD_FOLDER'], 'compressed_images.zip')
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for image_file in compressed_images:
            zipf.write(image_file, os.path.basename(image_file))
    return send_file(zip_path, as_attachment=True, download_name='compressed_images.zip')


@app.route('/rearrange-pdf', methods=['POST'])
def rearrange_pdf():
    file = request.files.get('pdf')
    if not file or not allowed_file(file.filename):
        return jsonify({"message": "Invalid or no PDF file provided."}), 400

    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
    file.save(pdf_path)
    doc = fitz.open(pdf_path)

    # Example: Reverse pages for demonstration
    new_doc = fitz.open()
    for i in range(len(doc) - 1, -1, -1):
        new_doc.insert_pdf(doc, from_page=i, to_page=i)

    rearranged_pdf_path = os.path.join(
        app.config['UPLOAD_FOLDER'],
        'rearranged_' + secure_filename(file.filename)
    )
    new_doc.save(rearranged_pdf_path)
    doc.close()
    new_doc.close()
    return send_file(rearranged_pdf_path, as_attachment=True, download_name='rearranged.pdf')


# ------------------------------
# MAIN
# ------------------------------
if __name__ == '__main__':
    # For local testing; On Render, gunicorn will call 'app:app'.
    # But it's okay to keep the dev run here:
    app.run(debug=True)
