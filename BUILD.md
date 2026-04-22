# Resume Build Guide

## Files

| File | Description |
|------|-------------|
| `resume.md` | Chinese resume (source) |
| `resume_en.md` | English resume (source) |
| `resume.html` | Chinese resume (HTML) |
| `resume_en.html` | English resume (HTML) |
| `resume.pdf` | Chinese resume (PDF) |
| `resume_en.pdf` | English resume (PDF) |
| `md2html.js` | Markdown to HTML converter |
| `resume.html.template` | HTML template with styles |

## Quick Start

```bash
# Build Chinese version
node md2html.js resume.md resume.html

# Build English version
node md2html.js resume_en.md resume_en.html

# Generate PDF (requires puppeteer)
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/resume.html', {waitUntil: 'networkidle0'});
  await page.pdf({path: 'resume.pdf', format: 'A4', margin: {top: '15mm', bottom: '15mm', left: '16mm', right: '16mm'}, printBackground: true});
  await page.goto('file://' + process.cwd() + '/resume_en.html', {waitUntil: 'networkidle0'});
  await page.pdf({path: 'resume_en.pdf', format: 'A4', margin: {top: '15mm', bottom: '15mm', left: '16mm', right: '16mm'}, printBackground: true});
  await browser.close();
  console.log('Done');
})();
"
```

## One-liner

```bash
# Build all
node md2html.js resume.md resume.html && \
node md2html.js resume_en.md resume_en.html && \
node -e "require('puppeteer').launch({headless:true}).then(b=>b.newPage().then(p=>p.goto('file://'+process.cwd()+'/resume.html',{waitUntil:'networkidle0'}).then(()=>p.pdf({path:'resume.pdf',format:'A4',margin:{top:'15mm',bottom:'15mm',left:'16mm',right:'16mm'}}).then(()=>p.goto('file://'+process.cwd()+'/resume_en.html',{waitUntil:'networkidle0'}).then(()=>p.pdf({path:'resume_en.pdf',format:'A4',margin:{top:'15mm',bottom:'15mm',left:'16mm',right:'16mm'}}).then(()=>b.close()))))))"
```

## Markdown Format

### Header

```markdown
# Nathan

- Phone: (+86) 13145859636
- Email: thatsaid@hotmail.com
- Headline: Multimodal LLM / Video Understanding Engineer
```

### Work Experience

```markdown
## Work Experience

### Company Name
Job Title | Location  
2020.01 - Present

**Project: Project Name**

- Description line 1.
- Description line 2.
```

### Education

```markdown
## Education

**University** | School | Degree  
2015.09 - 2018.06
```

### Skills

```markdown
## Skills

- **Skill Category**: Description.
- **Another Skill**: Description.
```

## Dependencies

- Node.js
- puppeteer (for PDF generation): `npm install puppeteer --no-save`
