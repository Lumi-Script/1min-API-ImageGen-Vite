import React, { useState, useEffect, useRef } from 'react';
import { 
  Key, Settings, Image as ImageIcon, Zap, Upload, 
  Download, Sparkles, Folder, Play, CheckCircle2,
  AlertCircle, Loader2
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  DzineStyles
} from './constants';

// We import constants from parent project since the frontend is inside Project/frontend
// Actually we can't easily import from outside src in Vite unless configured. 
// We will just copy the basic default keys or use dynamic building.
// Wait, the prompt said: "Reference `c:/alpine/sunobot/DisplayPictures/Project/constants.ts` for what parameters are valid"
// Since Vite normally blocks imports outside of src without config, I'll redefine the minimal needed defaults here,
// or I can try to import if Vite allows it (it might not by default).
// I will just redefine the defaults locally in this file to be safe.

const MODELS = [
  { id: 'gpt-image-1', name: 'GPT Image 1' },
  { id: 'gpt-image-1-mini', name: 'GPT Image 1 Mini' },
  { id: 'gpt-image-2', name: 'GPT Image 2' },
  { id: 'black-forest-labs/flux-2-klein-4b', name: 'Flux 2 (4B)' },
  { id: 'black-forest-labs/flux-2-klein-9b', name: 'Flux 2 (9B)' },
  { id: 'dzine', name: 'Dzine' },
  { id: 'upscale', name: 'Stable Upscaler' }
];

export default function App() {
  // API Keys
  const [minAiKey, setMinAiKey] = useState(() => localStorage.getItem('minAiKey') || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('geminiKey') || '');
  const [showKeys, setShowKeys] = useState(false);

  // Settings
  const [model, setModel] = useState('gpt-image-1');
  const [numImages, setNumImages] = useState(1);
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('medium');
  const [outputFormat, setOutputFormat] = useState('webp');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [dzineStyle, setDzineStyle] = useState(DzineStyles?.[0]?.style_code || '');
  
  // Output Mode
  const [useZip, setUseZip] = useState(true);

  // Prompts
  const [promptsText, setPromptsText] = useState('');
  
  // Gemini Generator
  const [geminiTopic, setGeminiTopic] = useState('');
  const [geminiQuantity, setGeminiQuantity] = useState('5');
  const [geminiModelSelection, setGeminiModelSelection] = useState('gemini-3.7-flash');
  const [customGeminiModel, setCustomGeminiModel] = useState('');
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);

  // Execution
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<{message: string, type: 'info'|'success'|'error'}[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save keys
  useEffect(() => {
    localStorage.setItem('minAiKey', minAiKey);
    localStorage.setItem('geminiKey', geminiKey);
  }, [minAiKey, geminiKey]);

  const addLog = (message: string, type: 'info'|'success'|'error' = 'info') => {
    setLogs(prev => [...prev, { message, type }]);
  };

  const handleUploadPrompts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setPromptsText(prev => prev ? prev + '\n' + text : text);
      addLog(`Loaded ${text.split('\n').filter(l => l.trim()).length} prompts from ${file.name}`, 'success');
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateGeminiPrompts = async () => {
    if (!geminiKey) return addLog('Please enter your Google AI Studio API key.', 'error');
    if (!geminiTopic.trim()) return addLog('Please enter a topic for prompt generation.', 'error');

    setIsGeneratingPrompts(true);
    addLog(`Generating ${geminiQuantity} prompts using Gemini for topic: ${geminiTopic}...`);
    
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const selectedModelName = geminiModelSelection === 'custom' ? customGeminiModel : geminiModelSelection;
      if (geminiModelSelection === 'custom' && !selectedModelName.trim()) {
        return addLog('Please enter a custom model code.', 'error');
      }
      const geminiModel = genAI.getGenerativeModel({ model: selectedModelName });
      
      const prompt = `You are an expert AI image prompt engineer. 
Generate exactly ${geminiQuantity} highly descriptive, creative, and detailed image generation prompts based on this topic: "${geminiTopic}".
Output ONLY the prompts, one per line. Do not number them. Do not include quotes or any intro/outro text.`;
      
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      const newPrompts = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      setPromptsText(prev => prev ? prev + '\n' + newPrompts.join('\n') : newPrompts.join('\n'));
      addLog(`Successfully generated ${newPrompts.length} prompts.`, 'success');
    } catch (err: any) {
      addLog(`Error generating prompts: ${err.message}`, 'error');
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const startGeneration = async () => {
    if (!minAiKey) return addLog('Please enter your 1min.ai API key.', 'error');
    
    const lines = promptsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return addLog('No prompts found.', 'error');

    setIsGenerating(true);
    setLogs([]);
    addLog(`Starting generation for ${lines.length} prompts using ${model}...`);

    let dirHandle: FileSystemDirectoryHandle | null = null;
    const zip = new JSZip();

    if (!useZip) {
      try {
        // @ts-ignore
        dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      } catch (err) {
        addLog('Directory selection cancelled or failed.', 'error');
        setIsGenerating(false);
        return;
      }
    }

    let successCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const p = lines[i];
      addLog(`[${i+1}/${lines.length}] Requesting: ${p.substring(0, 30)}...`);
      
      try {
        let promptObject: any = {
          [model === 'upscale' ? 'imageUrl' : 'prompt']: p,
          output_format: outputFormat
        };

        if (model.startsWith('gpt-image-1') || model === 'gpt-image-2') {
          promptObject.n = numImages;
          promptObject.size = size;
          promptObject.quality = ['low', 'medium', 'high'].includes(quality.toLowerCase()) ? quality.toLowerCase() : 'medium';
        } else if (model.startsWith('black-forest-labs/flux-2-klein')) {
          promptObject.aspect_ratio = aspectRatio;
          if (outputFormat === 'jpeg') promptObject.output_format = 'jpg';
        } else if (model === 'dzine') {
          promptObject.n = numImages;
          promptObject.quality = ['HIGH', 'STANDARD'].includes(quality.toUpperCase()) ? quality.toUpperCase() : 'STANDARD';
          if (outputFormat === 'png') promptObject.output_format = 'webp';
          const selectedStyle = DzineStyles.find(s => s.style_code === dzineStyle) || DzineStyles[0];
          if (selectedStyle) {
            promptObject.style_code = selectedStyle.style_code;
            promptObject.style_base_model = selectedStyle.style_base_model;
            promptObject.style_intensity = selectedStyle.style_intensity;
          }
        }

        const payload = {
          type: model === 'upscale' ? 'IMAGE_UPSCALER' : 'IMAGE_GENERATOR',
          model: model,
          promptObject
        };

        const res = await fetch('https://api.1min.ai/api/features', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': minAiKey
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error(`API Error: ${res.statusText}`);
        }

        const data = await res.json();
        let fileUrl = data?.aiRecord?.temporaryUrl || data?.fileUrl || data?.temporaryUrl;
        
        if (!fileUrl && data?.aiRecord?.images && data.aiRecord.images.length > 0) {
           fileUrl = data.aiRecord.images[0].url;
        }

        if (!fileUrl) {
          throw new Error('No image URL returned in response.');
        }

        addLog(`[${i+1}/${lines.length}] Fetching image...`);
        const proxyUrl = `/api/images?url=${encodeURIComponent(fileUrl)}`;
        const imgRes = await fetch(proxyUrl);
        const blob = await imgRes.blob();
        const filename = `image_${i+1}_${Date.now()}.${outputFormat}`;

        if (useZip) {
          zip.file(filename, blob);
        } else if (dirHandle) {
          // @ts-ignore
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          // @ts-ignore
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        }

        successCount++;
        addLog(`[${i+1}/${lines.length}] Successfully saved ${filename}.`, 'success');

      } catch (err: any) {
        addLog(`[${i+1}/${lines.length}] Failed: ${err.message}`, 'error');
      }
    }

    if (useZip && successCount > 0) {
      addLog('Zipping files...', 'info');
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `bulk_generation_${Date.now()}.zip`);
      addLog('Zip file downloaded.', 'success');
    }

    addLog(`Finished! Successfully generated ${successCount}/${lines.length} images.`, 'success');
    setIsGenerating(false);
  };

  return (
    <>
      <header>
        <div className="logo">
          <ImageIcon className="text-primary-color" />
          1min.ai Bulk Generator
        </div>
        <div className="header-actions">
          <div className="popover-container">
            <button 
              className="popover-trigger" 
              onClick={() => setShowKeys(!showKeys)}
            >
              <Key size={16} /> API Keys
            </button>
            {showKeys && (
              <div className="popover-content">
                <div className="input-group">
                  <label>1min.ai API Key</label>
                  <input 
                    type="password" 
                    value={minAiKey} 
                    onChange={e => setMinAiKey(e.target.value)} 
                    placeholder="Enter key..."
                  />
                  <a href="https://app.1min.ai/api" target="_blank" rel="noreferrer" className="link-text">
                    Get 1min.ai Key ↗
                  </a>
                </div>
                <div className="input-group">
                  <label>Google AI Studio API Key</label>
                  <input 
                    type="password" 
                    value={geminiKey} 
                    onChange={e => setGeminiKey(e.target.value)} 
                    placeholder="Enter key..."
                  />
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="link-text">
                    Get Gemini Key ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <div className="main-content">
          <div className="hero-boxes">
            <div className="hero-box">
              <div className="hero-icon"><ImageIcon /></div>
              <h3>Bulk Image Generation</h3>
              <p>Process hundreds of prompts automatically via 1min.ai.</p>
            </div>
            <div className="hero-box">
              <div className="hero-icon"><Sparkles /></div>
              <h3>Gemini Prompt Gen</h3>
              <p>Use Gemini 1.5 Flash to brainstorm high-quality prompts.</p>
            </div>
            <div className="hero-box">
              <div className="hero-icon"><Folder /></div>
              <h3>Auto-Zipping & Folder</h3>
              <p>Download directly as a Zip or save to your local folder.</p>
            </div>
          </div>

          <div className="section-panel">
            <div className="section-header">
              <div className="section-title">
                <Sparkles size={20} className="text-primary-color" />
                Gemini Prompt Generator
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                <label>Topic / Style</label>
                <input 
                  type="text" 
                  value={geminiTopic}
                  onChange={e => setGeminiTopic(e.target.value)}
                  placeholder="e.g. Cyberpunk cityscapes at night with neon lights"
                />
              </div>
              <div className="input-group" style={{ width: '100px', marginBottom: 0 }}>
                <label>Quantity</label>
                <select value={geminiQuantity} onChange={e => setGeminiQuantity(e.target.value)}>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
              <div className="input-group" style={{ width: '140px', marginBottom: 0 }}>
                <label>Model</label>
                <select value={geminiModelSelection} onChange={e => setGeminiModelSelection(e.target.value)}>
                  <option value="gemini-3.7-flash">3.7 Flash</option>
                  <option value="gemini-3.6-flash">3.6 Flash</option>
                  <option value="gemini-3.5-flash">3.5 Flash</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>
              {geminiModelSelection === 'custom' && (
                <div className="input-group" style={{ width: '140px', marginBottom: 0 }}>
                  <label>Model Code</label>
                  <input 
                    type="text" 
                    value={customGeminiModel}
                    onChange={e => setCustomGeminiModel(e.target.value)}
                    placeholder="e.g. gemini-pro"
                  />
                </div>
              )}
              <button 
                className="btn btn-secondary" 
                onClick={generateGeminiPrompts}
                disabled={isGeneratingPrompts}
              >
                {isGeneratingPrompts ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Generate
              </button>
            </div>
          </div>

          <div className="section-panel">
            <div className="section-header">
              <div className="section-title">
                <ImageIcon size={20} className="text-primary-color" />
                Prompts List
              </div>
              <div>
                <input 
                  type="file" 
                  accept=".txt" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleUploadPrompts}
                />
                <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> Upload .txt
                </button>
              </div>
            </div>
            <div className="input-group">
              <textarea 
                className="prompts-textarea"
                placeholder="Enter prompts here, one per line..."
                value={promptsText}
                onChange={e => setPromptsText(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {promptsText.split('\n').filter(l => l.trim()).length} prompts loaded.
            </div>
          </div>
        </div>

        <aside className="sidebar">
          <div className="settings-panel">
            <div className="settings-title">
              <Settings size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }}/>
              Configuration
            </div>
            
            <div className="input-group">
              <label>Model</label>
              <select value={model} onChange={e => setModel(e.target.value)}>
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {(model.startsWith('gpt-image') || model === 'dzine') && (
              <div className="input-group">
                <label>Number of Images (n)</label>
                <select value={numImages} onChange={e => setNumImages(Number(e.target.value))}>
                  {model.startsWith('gpt-image') ? 
                    [1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>) :
                    [1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)
                  }
                </select>
              </div>
            )}

            {model.startsWith('gpt-image') && (
              <div className="input-group">
                <label>Size</label>
                <select value={size} onChange={e => setSize(e.target.value)}>
                  <option value="1024x1024">1024x1024 (1:1)</option>
                  <option value="1536x1024">1536x1024 (3:2)</option>
                  <option value="1024x1536">1024x1536 (2:3)</option>
                </select>
              </div>
            )}

            {model.startsWith('black-forest-labs/flux-2-klein') && (
              <div className="input-group">
                <label>Aspect Ratio</label>
                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}>
                  <option value="1:1">1:1</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="3:2">3:2</option>
                  <option value="2:3">2:3</option>
                  <option value="4:5">4:5</option>
                  <option value="5:4">5:4</option>
                </select>
              </div>
            )}

            {model === 'dzine' && (
              <div className="input-group">
                <label>Style</label>
                <select value={dzineStyle} onChange={e => setDzineStyle(e.target.value)}>
                  {DzineStyles?.map(s => (
                    <option key={s.style_code} value={s.style_code}>{s.name || s.style_code}</option>
                  ))}
                </select>
              </div>
            )}

            {(model.startsWith('gpt-image') || model === 'dzine') && (
              <div className="input-group">
                <label>Quality</label>
                <select value={quality} onChange={e => setQuality(e.target.value)}>
                  {model === 'dzine' ? (
                    <>
                      <option value="STANDARD">Standard</option>
                      <option value="HIGH">High</option>
                    </>
                  ) : (
                    <>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <div className="input-group">
              <label>Output Format</label>
              <select value={outputFormat} onChange={e => setOutputFormat(e.target.value)}>
                {model.startsWith('black-forest-labs/flux-2-klein') ? (
                  <>
                    <option value="webp">WebP</option>
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                  </>
                ) : (
                  <>
                    <option value="webp">WebP</option>
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                  </>
                )}
              </select>
            </div>

            <div className="settings-title" style={{ marginTop: '1.5rem' }}>
              <Download size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }}/>
              Output Options
            </div>

            <label className="checkbox-group">
              <input 
                type="checkbox" 
                checked={useZip} 
                onChange={e => setUseZip(e.target.checked)}
              />
              <span>Zip output (downloads all at once)</span>
            </label>
            {!useZip && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginLeft: '2rem' }}>
                Will prompt to select a local directory using the File System Access API.
              </p>
            )}
          </div>

          <button 
            className="btn btn-primary btn-lg" 
            onClick={startGeneration}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Play />}
            Start Generation
          </button>

          {logs.length > 0 && (
            <div className="status-log">
              {logs.map((log, i) => (
                <div key={i} className={`status-line ${log.type}`}>
                  {log.type === 'error' && <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />}
                  {log.type === 'success' && <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />}
                  {log.message}
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>
    </>
  );
}
