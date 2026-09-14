import os, zipfile, io, base64
from PIL import Image, ImageDraw
import piexif
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import white, black, HexColor

out_dir = r"e:\ctc\crack-the-code\public\ctf"
os.makedirs(out_dir, exist_ok=True)

# 1. photo.jpg
img1 = Image.new("RGB", (800, 600), color=(30, 41, 59))
draw = ImageDraw.Draw(img1)
draw.rectangle([50, 50, 750, 550], outline=(71, 85, 105), width=3)
draw.text((100, 100), "PROJECT ARCHIVE // PHOTO LAB #402", fill=(148, 163, 184))
draw.text((100, 140), "Dr. Alex Thomas - Research Station Snapshot", fill=(226, 232, 240))
draw.rectangle([100, 200, 700, 480], fill=(15, 23, 42), outline=(51, 65, 85), width=2)
draw.text((130, 240), "SYSTEM DIAGNOSTICS: NOMINAL", fill=(52, 211, 153))
draw.text((130, 280), "SECURITY SUITE: ARMED", fill=(56, 189, 248))
draw.text((130, 320), "TIMESTAMP: 2026-09-11 02:44:19 UTC", fill=(148, 163, 184))
draw.text((130, 400), "[RECOVERED FROM ENCRYPTED PARTITION]", fill=(244, 63, 94))

hex_title = "6D 65 65 74 69 6E 67 2E 70 6E 67"
xp_title = hex_title.encode("utf-16le") + b"\x00\x00"

zeroth_ifd = {
    piexif.ImageIFD.Artist: "Alex Thomas".encode("utf-8"),
    piexif.ImageIFD.ImageDescription: "Look at the other picture.".encode("utf-8"),
    piexif.ImageIFD.Software: hex_title.encode("utf-8"),
    0x9c9b: xp_title,
}
exif_ifd = {
    piexif.ExifIFD.UserComment: b"ASCII\x00\x00\x00" + hex_title.encode("utf-8")
}
exif_dict = {"0th": zeroth_ifd, "Exif": exif_ifd, "GPS": {}, "1st": {}, "thumbnail": None}
exif_bytes = piexif.dump(exif_dict)
img1.save(os.path.join(out_dir, "photo.jpg"), "JPEG", exif=exif_bytes, quality=95)
print("Generated photo.jpg")

# 2. meeting.png
img2 = Image.new("RGB", (800, 600), color=(15, 23, 42))
draw2 = ImageDraw.Draw(img2)
draw2.rectangle([40, 40, 760, 560], outline=(59, 130, 246), width=2)
draw2.text((80, 80), "CONFERENCE ROOM DELTA // RESEARCH ALLIANCE", fill=(96, 165, 250))
draw2.text((80, 120), "Meeting Minutes - Forensic Debrief", fill=(226, 232, 240))
draw2.rectangle([80, 170, 720, 500], fill=(2, 6, 23), outline=(30, 41, 59), width=2)
draw2.text((110, 210), "ATTENDEES: Dr. Alex Thomas, Lead Architect, Security Ops", fill=(203, 213, 225))
draw2.text((110, 250), "AGENDA: Cryptographic verification of data pipelines", fill=(148, 163, 184))
draw2.text((110, 290), "STATUS: File vaults initialized", fill=(148, 163, 184))
draw2.text((110, 350), "NOTE: Digital watermarking protocol active.", fill=(251, 146, 60))

hidden_payload = "VGhlIHBhc3N3b3JkIGlzOiBkb2N1bWVudA=="
payload_bytes = hidden_payload.encode("utf-8")
length_prefix = len(payload_bytes).to_bytes(2, "big")
full_data = length_prefix + payload_bytes
bits = "".join(f"{byte:08b}" for byte in full_data)

pixels = img2.load()
bit_idx = 0
for y in range(img2.height):
    for x in range(img2.width):
        if bit_idx < len(bits):
            r, g, b = pixels[x, y]
            new_r = (r & ~1) | int(bits[bit_idx])
            pixels[x, y] = (new_r, g, b)
            bit_idx += 1
        else:
            break
    if bit_idx >= len(bits):
        break

from PIL.PngImagePlugin import PngInfo
meta2 = PngInfo()
meta2.add_text("StegoData", hidden_payload)
meta2.add_text("Comment", "Encrypted Stego Layer Active")
img2.save(os.path.join(out_dir, "meeting.png"), "PNG", pnginfo=meta2)
print("Generated meeting.png")

# 3. report.docx
docx_path = os.path.join(out_dir, "report.docx")
with zipfile.ZipFile(docx_path, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("[Content_Types].xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>""")
    
    zf.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>""")
    
    zf.writestr("word/document.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>CYBERSECURITY INCIDENT REPORT</w:t></w:r></w:p>
    <w:p><w:r><w:t>Researcher: Alex Thomas</w:t></w:r></w:p>
    <w:p><w:r><w:t>The investigation began on Monday.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Several authentication systems were tested.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Access controls were reviewed.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Encryption mechanisms were analyzed.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Logging systems were inspected.</w:t></w:r></w:p>
    <w:p><w:r><w:t>No obvious compromise was detected.</w:t></w:r></w:p>
    <w:p><w:r><w:t>CONCLUSION</w:t></w:r></w:p>
    <w:p><w:r><w:t>The system appears to be secure.</w:t></w:r></w:p>
  </w:body>
</w:document>""")

    zf.writestr("customXml/item1.xml", """<?xml version="1.0" encoding="UTF-8"?>
<message>
  The next clue is inside the PDF.
</message>""")

print("Generated report.docx")

# 4. notes.pdf
pdf_path = os.path.join(out_dir, "notes.pdf")
c = canvas.Canvas(pdf_path, pagesize=letter)
c.setTitle("Research Notes - Alex Thomas")
c.setAuthor("Alex Thomas")

c.setFont("Helvetica-Bold", 22)
c.setFillColor(HexColor("#0F172A"))
c.drawString(72, 720, "RESEARCH NOTES")

c.setFont("Helvetica", 12)
c.setFillColor(HexColor("#475569"))
c.drawString(72, 690, "Dr. Alex Thomas // System Security Assessment")
c.line(72, 680, 540, 680)

notes = [
    "01 — Access Control",
    "02 — Encryption",
    "03 — Logging",
    "04 — Monitoring",
    "05 — Incident Response",
    "",
    "All systems were tested successfully.",
    "Nothing unusual was detected."
]

c.setFont("Helvetica", 13)
c.setFillColor(HexColor("#1E293B"))
y = 640
for line in notes:
    c.drawString(72, y, line)
    y -= 26

# Hidden text: white on white background!
c.setFont("Helvetica-Bold", 14)
c.setFillColor(white)
c.drawString(72, y - 40, "KEY: 435446")

c.save()
print("Generated notes.pdf")

# 5. evidence.png
img5 = Image.new("RGB", (900, 650), color=(15, 23, 42))
draw5 = ImageDraw.Draw(img5)

draw5.rectangle([0, 0, 900, 40], fill=(2, 6, 23))
draw5.text((20, 12), "WORKSTATION OS // USER: ATHOMAS [ACTIVE LAB SESSION]", fill=(148, 163, 184))

folders = ["Research/", "Documents/", "Photos/", "Evidence/", "final.txt"]
for i, folder in enumerate(folders):
    fx = 60
    fy = 70 + i * 90
    draw5.rectangle([fx, fy, fx + 60, fy + 50], fill=(30, 41, 59), outline=(96, 165, 250), width=2)
    draw5.text((fx + 10, fy + 18), "DIR" if "/" in folder else "TXT", fill=(250, 204, 21))
    draw5.text((fx + 75, fy + 18), folder, fill=(241, 245, 249))

draw5.rectangle([340, 60, 860, 600], fill=(2, 6, 23), outline=(51, 65, 85), width=2)
draw5.rectangle([340, 60, 860, 95], fill=(30, 41, 59))
draw5.text((360, 72), "EVIDENCE VIEWER // TARGET LOG: EXPLOIT_VECTOR.LOG", fill=(226, 232, 240))

draw5.text((365, 115), "[INFO] Parsing optical telemetry...", fill=(52, 211, 153))
draw5.text((365, 140), "[INFO] Target device scanned: Handheld Terminal", fill=(148, 163, 184))
draw5.text((365, 165), "[WARN] Embedded biometric matrix requires scanner sync", fill=(251, 146, 60))
draw5.text((365, 200), "RECOVERED OPTICAL ARTIFACT:", fill=(244, 63, 94))

flag_text = "FLAG{alex_left_more_than_a_message}"
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=6,
    border=2,
)
qr.add_data(flag_text)
qr.make(fit=True)
qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

img5.paste(qr_img, (480, 250))
draw5.rectangle([476, 246, 480 + qr_img.width + 4, 250 + qr_img.height + 4], outline=(56, 189, 248), width=3)
draw5.text((450, 250 + qr_img.height + 15), "SCAN WITH HIGH RESOLUTION OPTICAL SENSOR", fill=(148, 163, 184))

img5.save(os.path.join(out_dir, "evidence.png"), "PNG")
print("Generated evidence.png")
print("SUCCESS: All 5 test CTF files are generated in public/ctf/")
