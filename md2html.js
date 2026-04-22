const fs = require('fs');

const args = process.argv.slice(2);
const MD_FILE = args[0] || 'resume.md';
const HTML_FILE = args[1] || MD_FILE.replace('.md', '.html');
const TEMPLATE_FILE = 'resume.html.template';
const isEnglish = MD_FILE.includes('_en');

// 读取模板样式
const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
const styleMatch = template.match(/<style>([\s\S]*?)<\/style>/);
let style = styleMatch ? styleMatch[0] : '';

// 如果是英文版，修改字体
if (isEnglish) {
  style = style.replace(
    /font-family: "[^"]+", "[^"]+", sans-serif;/,
    'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;'
  );
}

// 读取 markdown
const md = fs.readFileSync(MD_FILE, 'utf-8');

// 解析 markdown 内容
const lines = md.split('\n');
const data = {
  name: '',
  phone: '',
  email: '',
  headline: '',
  sections: []
};

let currentSection = null;
let currentCompany = null;
let pendingEducationDate = '';

for (const line of lines) {
  if (line.startsWith('# ')) {
    data.name = line.slice(2).trim();
  } else if (line.startsWith('- 电话：') || line.startsWith('- Phone:')) {
    const match = line.match(/（[^）]+）\s*(\d+)/);
    data.phone = match ? match[1] : (line.match(/\d{11}/)?.[0] || '');
  } else if (line.startsWith('- 邮箱：') || line.startsWith('- Email:')) {
    data.email = line.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || '';
  } else if (line.startsWith('- Headline:')) {
    data.headline = line.replace('- Headline:', '').trim();
  } else if (line.startsWith('## ')) {
    currentSection = { title: line.slice(3).trim(), companies: [] };
    data.sections.push(currentSection);
    currentCompany = null;
  } else if (line.startsWith('### ')) {
    currentCompany = { name: line.slice(4).trim(), role: '', items: [], projects: [] };
    currentSection.companies.push(currentCompany);
  } else if (line.startsWith('**项目：') || line.startsWith('**Project:')) {
    if (currentCompany) {
      const isChinese = line.startsWith('**项目：');
      const projectName = line.replace(/\*\*/g, '').replace(isChinese ? '项目：' : 'Project:', '');
      const project = { name: (isChinese ? '项目：' : 'Project: ') + projectName.trim(), items: [] };
      currentCompany.projects.push(project);
    }
  } else if (line.startsWith('- **') && (currentSection?.title === '专业技能' || currentSection?.title === 'Skills')) {
    currentSection.items = currentSection.items || [];
    const htmlItem = line.slice(2).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    currentSection.items.push(htmlItem);
  } else if (line.startsWith('- ') && currentCompany) {
    const item = line.slice(2);
    if (currentCompany.projects.length > 0) {
      currentCompany.projects[currentCompany.projects.length - 1].items.push(item);
    } else {
      currentCompany.items.push(item);
    }
  } else if (line.startsWith('**') && !line.startsWith('**项目') && !line.startsWith('**Project')) {
    if (currentSection && !currentSection.companies.length) {
      currentSection.items = currentSection.items || [];
      const item = line.replace(/\*\*/g, '');
      pendingEducationDate = item;
    }
  } else if (line.match(/^[^\s#\-].*[｜|]/) && currentCompany) {
    const separator = line.includes('｜') ? '｜' : ' | ';
    const parts = line.split(/[｜|]/);
    if (parts.length >= 2) {
      currentCompany.role = parts.map(p => p.trim()).join(separator);
    }
  } else if (line.match(/^\d{4}\.\d{2}/)) {
    if (currentCompany) {
      const separator = currentCompany.role.includes('｜') ? '｜' : ' | ';
      currentCompany.role += separator + line.trim();
    } else if ((currentSection?.title === '教育背景' || currentSection?.title === 'Education') && pendingEducationDate) {
      currentSection.items.push(pendingEducationDate + ' ' + line.trim());
      pendingEducationDate = '';
    }
  }
}

// 生成 HTML
const lang = isEnglish ? 'en' : 'zh-CN';
let html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.name} Resume</title>
  ${style}
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>${data.name}</h1>
      <div class="subheader">
        <p class="headline">${data.headline}</p>
        <div class="header-right">
          <p>Tel: ${data.phone}</p>
          <p>Email: ${data.email}</p>
        </div>
      </div>
    </div>
`;

for (const section of data.sections) {
  html += `    <div class="section">\n      <h2>${section.title}</h2>\n`;
  
  if (section.companies) {
    for (const company of section.companies) {
      html += `      <div class="company-block">\n`;
      html += `        <h3>${company.name}</h3>\n`;
      html += `        <p class="meta role-line">${company.role}</p>\n`;
      
      for (const project of company.projects || []) {
        html += `        <p class="project">${project.name}</p>\n`;
        html += `        <ul>\n`;
        for (const item of project.items) {
          html += `          <li>${item}</li>\n`;
        }
        html += `        </ul>\n`;
      }
      
      if (company.items?.length) {
        html += `        <ul>\n`;
        for (const item of company.items) {
          html += `          <li>${item}</li>\n`;
        }
        html += `        </ul>\n`;
      }
      
      html += `      </div>\n`;
    }
  }
  
  if (section.items?.length) {
    if (section.title === '专业技能' || section.title === 'Skills') {
      html += `        <ul class="skills">\n`;
      for (const item of section.items) {
        html += `          <li>${item}</li>\n`;
      }
      html += `        </ul>\n`;
    } else if (section.title === '教育背景' || section.title === 'Education') {
      for (const item of section.items) {
        const separator = item.includes('｜') ? '｜' : ' | ';
        const parts = item.split(/[｜|]/);
        if (parts.length >= 2) {
          html += `      <p><strong>${parts[0]}</strong>${separator}${parts.slice(1).join(separator)}</p>\n`;
        } else {
          html += `      <p><strong>${item}</strong></p>\n`;
        }
      }
    }
  }
  
  html += `    </div>\n`;
}

html += `  </div>
</body>
</html>`;

fs.writeFileSync(HTML_FILE, html);
console.log('HTML generated:', HTML_FILE);
