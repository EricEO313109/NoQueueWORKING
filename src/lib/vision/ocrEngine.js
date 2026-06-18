let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['ron', 'eng'], 1, {
        logger: () => {},
      });
      await worker.setParameters({
        tessedit_pageseg_mode: '6',
      });
      return worker;
    })();
  }
  return workerPromise;
}

export async function runOcr(imageDataUrl, onProgress) {
  onProgress?.({ stage: 'ocr', progress: 0.1, message: 'Citesc eticheta…' });
  const worker = await getWorker();
  onProgress?.({ stage: 'ocr', progress: 0.3, message: 'OCR în curs…' });

  const { data } = await worker.recognize(imageDataUrl);
  onProgress?.({ stage: 'ocr', progress: 0.9, message: 'Text detectat' });

  return {
    text: data.text || '',
    confidence: (data.confidence || 0) / 100,
  };
}

export async function terminateOcr() {
  if (workerPromise) {
    const w = await workerPromise;
    await w.terminate();
    workerPromise = null;
  }
}
