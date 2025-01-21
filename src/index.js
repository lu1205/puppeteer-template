const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3100;

// 设置模板引擎
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'ejs');

// 解析 JSON 数据
app.use(express.json());

// API 接口：生成 PDF
app.post('/pdf/generate-pdf', async (req, res) => {
  try {
    // 获取请求体中的数据
    const data = req.body;

    // 渲染模板
    const html = await renderTemplate(data);

    // 启动无头浏览器
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // 设置页面内容
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // 生成 PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    // 设置响应头部，告知客户端这是一个 PDF 文件
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('data-type', 'file');
    res.setHeader('Content-Length', pdfBuffer.length);

    // 创建一个可读流并管道到响应对象
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(pdfBuffer);
    bufferStream.pipe(res);

    // 在流结束时关闭浏览器实例
    bufferStream.on('end', () => browser.close());
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while generating the PDF.');
  }
});

async function renderTemplate(data) {
  return new Promise((resolve, reject) => {
    app.render('template', data, (err, html) => {
      if (err) return reject(err);
      resolve(html);
    });
  });
}


app.post('/pdf/generatePdfByUrl', async (req, res) => {
  try {
    // 获取请求体中的数据
    const data = req.body;

    if(!data.url) res.status(500).send('url is required');

    // 启动无头浏览器
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(data.url);

    // 生成 PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    // 设置响应头部，告知客户端这是一个 PDF 文件
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);

    // 创建一个可读流并管道到响应对象
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(pdfBuffer);
    bufferStream.pipe(res);

    // 在流结束时关闭浏览器实例
    bufferStream.on('end', () => browser.close());
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while generating the PDF.');
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on 127.0.0.1:${PORT}`);
});