import { useState } from 'react';
import { Modal, TextField, Select, Scrollable } from '@shopify/polaris';
import { X, Save, Copy, Info } from 'lucide-react';
import { DetailedTemplate } from '../../services/ai-generator/json-templates.service';
import { TemplateInput } from '../../services/ai-generator/template.service';
import { CustomTemplatesService } from '../../services/ai-generator/custom-templates.service';

interface CustomTemplateModalProps {
  baseTemplate: DetailedTemplate;
  currentSettings: TemplateInput;
  storeId: string;
  onClose: () => void;
  onSave: () => void;
}

export function CustomTemplateModal({ baseTemplate, currentSettings, storeId, onClose, onSave }: CustomTemplateModalProps) {
  // Convert DetailedTemplate to a prompt template format
  const createPromptFromTemplate = (template: DetailedTemplate) => {
    return `${template.description}. Visual style: ${template.visual_style}. Camera: ${template.camera}. Main subject: ${template.main_subject}. Background: ${template.background}. Lighting: ${template.lighting_mood}. Color palette: ${template.color_palette}. Opening: ${template.hook}. Ending: ${template.finale}.`;
  };

  const [name, setName] = useState(`${baseTemplate.template_name} (Custom)`);
  const [description, setDescription] = useState(baseTemplate.description);
  const [category, setCategory] = useState(baseTemplate.meta.category);
  const [promptTemplate, setPromptTemplate] = useState(createPromptFromTemplate(baseTemplate));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const variables = [
    '{{product_name}}',
    '{{brand_name}}',
    '{{platform}}',
    '{{duration}}',
    '{{aspect_ratio}}',
    '{{background_style}}',
    '{{color_palette}}'
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a template name');
      return;
    }

    if (!promptTemplate.trim()) {
      setError('Please enter a prompt template');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const result = await CustomTemplatesService.saveCustomTemplate(storeId, {
        name: name.trim(),
        description: description.trim(),
        category,
        base_template_id: baseTemplate.template_name,
        settings: {
          visual_style: currentSettings.visual_style,
          camera_motion: currentSettings.camera_motion,
          lens_effect: currentSettings.lens_effect,
          lighting_mood: currentSettings.lighting_mood,
          background_style: currentSettings.background_style,
          tone: currentSettings.tone,
          color_palette: currentSettings.color_palette,
          platform: currentSettings.platform,
          duration: currentSettings.duration,
          tier: 'Pro',
          prompt_template: promptTemplate,
          keywords: baseTemplate.keywords,
          negative_prompt: baseTemplate.negative_prompt,
        },
      });

      if (!result) {
        throw new Error('Failed to save template');
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save custom template:', err);
      setError('Failed to save template. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('prompt-template') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = promptTemplate.substring(0, start) + variable + promptTemplate.substring(end);
      setPromptTemplate(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  return (
    <Modal
      open={true}
      onClose={isSaving ? () => {} : onClose}
      title={
        <div>
          <div className="flex items-center gap-2 font-bold">
            <Copy className="w-5 h-5 text-blue-500" />
            Create Custom Template
          </div>
          <div className="text-sm text-gray-500 font-normal">Based on: {baseTemplate.template_name}</div>
        </div>
      }
      large
      primaryAction={{
        content: isSaving ? 'Saving...' : 'Save Template',
        onAction: handleSave,
        loading: isSaving,
        disabled: isSaving || !name.trim() || !promptTemplate.trim(),
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
          disabled: isSaving,
        },
      ]}
    >
      <Modal.Section>
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950/20 rounded-lg p-6">
          <Scrollable shadow style={{ maxHeight: '60vh' }}>
            <div className="space-y-6 pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <TextField
                label="Template Name"
                value={name}
                onChange={setName}
                placeholder="My Custom Template"
                maxLength={50}
                autoComplete="off"
              />
            </div>

            <div>
              <Select
                label="Category"
                options={[
                  { label: 'Product Focus', value: 'Product Focus' },
                  { label: 'Lifestyle', value: 'Lifestyle' },
                  { label: 'UGC', value: 'UGC' },
                  { label: 'Custom', value: 'Custom' },
                ]}
                value={category}
                onChange={setCategory}
              />
            </div>
          </div>

          <div>
            <TextField
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Describe what this template does..."
              maxLength={200}
              multiline={2}
              autoComplete="off"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                Prompt Template
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 invisible group-hover:visible z-10 shadow-xl">
                    Use variables like {`{{product_name}}`} to insert dynamic content. Click the variable buttons below to insert them at your cursor position.
                  </div>
                </div>
              </label>
              <span className="text-xs text-gray-400">
                {promptTemplate.length} / 2000
              </span>
            </div>
            <TextField
              id="prompt-template"
              label=""
              labelHidden
              value={promptTemplate}
              onChange={setPromptTemplate}
              placeholder="Enter your custom prompt template..."
              maxLength={2000}
              multiline={8}
              autoComplete="off"
              monospaced
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-100 mb-3">
              Available Variables
            </label>
            <div className="flex flex-wrap gap-2">
              {variables.map((variable) => (
                <button
                  key={variable}
                  onClick={() => insertVariable(variable)}
                  className="min-h-[44px] px-3 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-700/50 rounded-lg text-xs font-mono transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {variable}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Click a variable to insert it at your cursor position in the template
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}
            </div>
          </Scrollable>
        </div>
      </Modal.Section>
    </Modal>
  );
}
