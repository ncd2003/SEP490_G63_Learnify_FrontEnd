import zipfile
from pathlib import Path

out_path = Path(r"d:\Learnify\SEP490_G63_Learnify_FrontEnd\public\Syllabus_Example.docx")

content_types = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">
  <Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>
  <Default Extension=\"xml\" ContentType=\"application/xml\"/>
  <Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/>
  <Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>
  <Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/>
</Types>
"""

rels = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/>
  <Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>
  <Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/>
</Relationships>
"""

doc_rels = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"/>
"""

core = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\"
  xmlns:dc=\"http://purl.org/dc/elements/1.1/\"
  xmlns:dcterms=\"http://purl.org/dc/terms/\"
  xmlns:dcmitype=\"http://purl.org/dc/dcmitype/\"
  xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">
  <dc:title>SYLLABUS EXAMPLE</dc:title>
  <dc:creator>Learnify</dc:creator>
  <cp:lastModifiedBy>Learnify</cp:lastModifiedBy>
  <dcterms:created xsi:type=\"dcterms:W3CDTF\">2026-05-06T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type=\"dcterms:W3CDTF\">2026-05-06T00:00:00Z</dcterms:modified>
</cp:coreProperties>
"""

app = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\"
  xmlns:vt=\"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes\">
  <Application>Microsoft Office Word</Application>
</Properties>
"""

doc = """<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">
  <w:body>
    <w:p>
      <w:r><w:t>SYLLABUS EXAMPLE</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Class: English Communication Basics</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Format: Session | Topic | Learning-Teaching Type | Student Materials | Student's Tasks</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w=\"0\" w:type=\"auto\"/>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w=\"1700\"/>
        <w:gridCol w:w=\"2400\"/>
        <w:gridCol w:w=\"2200\"/>
        <w:gridCol w:w=\"2200\"/>
        <w:gridCol w:w=\"2200\"/>
      </w:tblGrid>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Session</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Topic</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Learning-Teaching Type</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Student Materials</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Student's Tasks</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Greetings and Introductions</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Lecture + Pair Practice</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Slides, Handout A</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Role-play intro dialogues</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Daily Routines</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Discussion + Practice</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Worksheet B</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Write a short routine paragraph</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
    <w:p>
      <w:r><w:t>Notes: Add more sessions following the same structure.</w:t></w:r>
    </w:p>
    <w:sectPr/>
  </w:body>
</w:document>
"""

out_path.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("[Content_Types].xml", content_types)
    zf.writestr("_rels/.rels", rels)
    zf.writestr("word/document.xml", doc)
    zf.writestr("word/_rels/document.xml.rels", doc_rels)
    zf.writestr("docProps/core.xml", core)
    zf.writestr("docProps/app.xml", app)

print(f"Recreated {out_path}")
