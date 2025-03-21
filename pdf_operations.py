from PIL import Image
import PyPDF2
import pytesseract
import io
import os

def convert_images_to_pdf(images):
    output = io.BytesIO()
    first_image = Image.open(images[0])
    img_converted = first_image.convert('RGB')
    other_pages = []
    
    for image in images[1:]:
        img = Image.open(image)
        other_pages.append(img.convert('RGB'))
    
    img_converted.save(output, format='PDF', save_all=True, append_images=other_pages)
    output.seek(0)
    return output

def compress_pdf(pdf_file, compression_level='medium'):
    pdf_bytes = io.BytesIO()
    reader = PyPDF2.PdfReader(pdf_file)
    writer = PyPDF2.PdfWriter()

    for page in reader.pages:
        writer.add_page(page)
    
    writer.write(pdf_bytes)
    pdf_bytes.seek(0)
    return pdf_bytes

def pdf_to_images(pdf_file):
    images = []
    pdf = PyPDF2.PdfReader(pdf_file)
    
    for page_num in range(len(pdf.pages)):
        # Note: This is a simplified version. For actual PDF to image conversion,
        # you might want to use additional libraries like pdf2image
        pass
    return images

def split_pdf(pdf_file, pages):
    pdf_bytes = io.BytesIO()
    reader = PyPDF2.PdfReader(pdf_file)
    writer = PyPDF2.PdfWriter()

    for page_num in pages:
        if 0 <= page_num < len(reader.pages):
            writer.add_page(reader.pages[page_num])
    
    writer.write(pdf_bytes)
    pdf_bytes.seek(0)
    return pdf_bytes

def merge_pdfs(pdf_files):
    pdf_bytes = io.BytesIO()
    writer = PyPDF2.PdfWriter()

    for pdf_file in pdf_files:
        reader = PyPDF2.PdfReader(pdf_file)
        for page in reader.pages:
            writer.add_page(page)
    
    writer.write(pdf_bytes)
    pdf_bytes.seek(0)
    return pdf_bytes

def pdf_to_text(pdf_file):
    reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def compress_image(image_file, quality=85):
    image = Image.open(image_file)
    img_bytes = io.BytesIO()
    image.save(img_bytes, format=image.format, optimize=True, quality=quality)
    img_bytes.seek(0)
    return img_bytes

def rearrange_pdf(pdf_file, page_order):
    pdf_bytes = io.BytesIO()
    reader = PyPDF2.PdfReader(pdf_file)
    writer = PyPDF2.PdfWriter()

    for page_num in page_order:
        if 0 <= page_num < len(reader.pages):
            writer.add_page(reader.pages[page_num])
    
    writer.write(pdf_bytes)
    pdf_bytes.seek(0)
    return pdf_bytes
