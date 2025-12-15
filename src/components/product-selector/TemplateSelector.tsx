import { useState, useEffect } from 'react';
import { Film, Heart, Users, Star, Lock, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { DetailedTemplate } from '../../services/ai-generator/json-templates.service';
import { CustomTemplatesService } from '../../services/ai-generator/custom-templates.service';

interface TemplateSelectorProps {
  templates: DetailedTemplate[];
  selectedTemplate: DetailedTemplate | null;
  onTemplateSelect: (template: DetailedTemplate) => void;
  userTier: string;
  storeId: string;
}

const categoryIcons: Record<string, any> = {
  'Cinematic Reveal': Film,
  'Lifestyle Connection': Heart,
  'UGC': Users,
  'Custom': Star,
};

const categoryDescriptions: Record<string, string> = {
  'Cinematic Reveal': 'Premium, high-end product reveals',
  'Lifestyle Connection': 'Natural, authentic everyday scenes',
  'UGC': 'Personal and relatable content',
  'Custom': 'Your saved custom templates',
};

export function TemplateSelector({
  templates,
  selectedTemplate,
  onTemplateSelect,
  userTier,
  storeId,
}: TemplateSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Cinematic Reveal']));
  const [customTemplates, setCustomTemplates] = useState<DetailedTemplate[]>([]);

  useEffect(() => {
    const fetchCustomTemplates = async () => {
      const custom = await CustomTemplatesService.getCustomTemplates(storeId);
      setCustomTemplates(custom);
    };
    fetchCustomTemplates();
  }, [storeId]);

  const canAccessTemplate = (template: DetailedTemplate): boolean => {
    const tierHierarchy: Record<string, number> = { 'free': 0, 'basic': 1, 'pro': 2 };
    const userLevel = tierHierarchy[userTier.toLowerCase()] || 0;
    const templateLevel = tierHierarchy[template.meta.tier.toLowerCase()] || 0;
    return userLevel >= templateLevel;
  };

  const allTemplatesSorted = [...templates].sort((a, b) => {
    const tierOrder: Record<string, number> = { 'pro': 0, 'basic': 1, 'free': 2 };
    return tierOrder[a.meta.tier.toLowerCase()] - tierOrder[b.meta.tier.toLowerCase()];
  });

  const allTemplatesWithCustom = [...allTemplatesSorted, ...customTemplates];

  const groupedTemplates = allTemplatesWithCustom.reduce((acc, template) => {
    const category = template.meta.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, DetailedTemplate[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getCleanDescription = (template: DetailedTemplate): string => {
    let desc = template.description;
    desc = desc.replace(/using\s+\{\{[^}]+\}\}/g, '');
    desc = desc.replace(/from\s+\{\{[^}]+\}\}/g, '');
    desc = desc.replace(/\{\{[^}]+\}\}/g, 'the product');
    desc = desc.replace(/\s+/g, ' ').trim();
    desc = desc.replace(/\s+([,.])/g, '$1');
    return desc;
  };

  return (
    <div className="space-y-2">
      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
        const Icon = categoryIcons[category] || Film;
        const isExpanded = expandedCategories.has(category);

        return (
          <div key={category} className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full min-h-[56px] px-3 py-3 bg-gray-800/50 hover:bg-gray-800 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 flex-1">
                <Icon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-100 text-sm mb-0.5">{category}</h4>
                  <p className="text-xs text-gray-400 line-clamp-1">{categoryDescriptions[category]}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs text-gray-400 font-medium bg-gray-700/50 px-2 py-1 rounded">{categoryTemplates.length}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-2 bg-gray-950/50 space-y-2">
                {categoryTemplates.map((template, index) => {
                  const isLocked = !canAccessTemplate(template);
                  const isPro = template.meta.tier.toLowerCase() === 'pro';
                  const isCustom = template.meta.category === 'Custom';
                  const isSelected = selectedTemplate?.template_name === template.template_name;

                  return (
                    <button
                      key={`${template.template_name}-${index}`}
                      onClick={() => !isLocked && onTemplateSelect(template)}
                      disabled={isLocked}
                      className={`w-full min-h-[80px] p-3 border-2 rounded-lg text-left transition-all relative flex flex-col ${
                        isLocked
                          ? 'border-gray-700 bg-gray-800/50 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? isCustom
                            ? 'border-amber-500 bg-amber-900/30 shadow-lg shadow-amber-500/20 scale-[1.02]'
                            : 'border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-500/20 scale-[1.02]'
                          : isCustom
                          ? 'border-amber-700/50 hover:border-amber-600 bg-gray-800 hover:shadow-sm'
                          : 'border-gray-700 hover:border-blue-600 bg-gray-800 hover:shadow-sm'
                      }`}
                    >
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 rounded-lg z-10">
                          <div className="text-center px-3">
                            <Lock className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                            <p className="text-xs font-semibold text-gray-300 mb-0.5">
                              {isPro ? 'Pro Plan' : 'Basic Plan'}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Upgrade to unlock
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-1.5">
                        <h5 className="font-semibold text-gray-100 text-sm pr-2 flex items-center gap-1 line-clamp-1">
                          {isCustom && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                          <span className="line-clamp-1">{template.template_name}</span>
                        </h5>
                        <span className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-semibold whitespace-nowrap ml-1 flex items-center gap-0.5 ${
                          isCustom ? 'bg-amber-900 text-amber-300' :
                          template.meta.tier.toLowerCase() === 'free' ? 'bg-gray-700 text-gray-300' :
                          template.meta.tier.toLowerCase() === 'basic' ? 'bg-blue-900 text-blue-300' :
                          'bg-gradient-to-r from-blue-900 to-blue-800 text-blue-300'
                        }`}>
                          {isCustom && <Star className="w-2.5 h-2.5" />}
                          {!isCustom && isPro && <Crown className="w-2.5 h-2.5" />}
                          {isCustom ? 'CUSTOM' : template.meta.tier.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed mb-2 line-clamp-2 flex-grow">
                        {getCleanDescription(template)}
                      </p>
                      <div className="flex gap-1 flex-wrap mt-auto">
                        {template.keywords.slice(0, 3).map((keyword, ki) => (
                          <span key={ki} className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded whitespace-nowrap">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
