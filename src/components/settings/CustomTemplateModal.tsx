import { useState } from 'react';
import { X, Save, Copy, Info } from 'lucide-react';
import { DetailedTemplate } from '../../services/ai-generator/json-templates.service';
import { supabase } from '../../lib/supabase';

interface CustomTemplateModalProps {
  baseTemplate: DetailedTemplate;
  storeId: string;
  onClose: () => void;
  onSave: () => void;
}

export function CustomTemplateModal({ baseTemplate, storeId, onClose, onSave }: CustomTemplateModalProps) {
  const [name, setName] = useState(`${baseTemplate.name} (Custom)`);
  const [description, setDescription] = useState(baseTemplate.description);
  const [category, setCategory] = useState(baseTemplate.meta.category);
  const [promptTemplate, setPromptTemplate] = useState(baseTemplate.prompt_template);
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
      const { error: saveError } = await supabase
        .from('custom_templates')
        .insert({
          store_id: storeId,
          name: name.trim(),
          description: description.trim(),
          category,
          base_template_id: baseTemplate.template_name,
          prompt_template: promptTemplate,
          variables: variables,
          settings: {
            tier: baseTemplate.meta.tier,
            default_aspect_ratio: '9:16',
            default_duration: 6,
          },
          is_favorite: false,
          is_enabled: true,
          usage_count: 0,
        });

      if (saveError) {
        throw saveError;
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-purple-500/20">
        <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-purple-900/30 border-b border-purple-500/20 px-6 py-4 flex items-center justify-between backdrop-blur-sm z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Copy className="w-6 h-6 text-purple-400" />
              Create Custom Template
            </h2>
            <p className="text-sm text-gray-400 mt-1">Based on: {baseTemplate.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Custom Template"
                maxLength={50}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Product Focus">Product Focus</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="UGC">UGC</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-100 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template does..."
              maxLength={200}
              rows={2}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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
            <textarea
              id="prompt-template"
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              placeholder="Enter your custom prompt template..."
              maxLength={2000}
              rows={8}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
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
                  className="px-3 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-700/50 rounded-lg text-xs font-mono transition-colors flex items-center gap-1"
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

        <div className="sticky bottom-0 bg-gradient-to-r from-gray-900 to-purple-900/30 border-t border-purple-500/20 px-6 py-4 backdrop-blur-sm flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 border-2 border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !promptTemplate.trim()}
            className="flex-1 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
