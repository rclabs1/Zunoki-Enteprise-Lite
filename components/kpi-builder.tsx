"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, X, ArrowLeft, ArrowRight, Search, Filter, 
  Zap, TrendingUp, Target, AlertTriangle, Settings,
  DragDropContext, Droppable, Draggable
} from 'lucide-react';
import { KPIDefinition, KPITemplateDefinition, getTemplateById } from '@/lib/kpi-templates';

interface CustomKPIBuilderProps {
  selectedTemplate?: string;
  onSave: (selectedKPIs: string[], customKPIs: CustomKPI[]) => void;
  onBack: () => void;
  className?: string;
}

interface CustomKPI {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  section: 'acquisition' | 'engagement' | 'retention' | 'business';
  dataSource: string;
  calculation: string;
  format: 'number' | 'currency' | 'percentage' | 'duration' | 'ratio';
  target?: number;
  benchmark?: number;
}

interface KPIOption extends KPIDefinition {
  section: string;
  templateName?: string;
  enabled: boolean;
}

const CustomKPIBuilder: React.FC<CustomKPIBuilderProps> = ({
  selectedTemplate,
  onSave,
  onBack,
  className = ''
}) => {
  const [availableKPIs, setAvailableKPIs] = useState<KPIOption[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [customKPIs, setCustomKPIs] = useState<CustomKPI[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterDataSource, setFilterDataSource] = useState<string>('all');
  const [showCustomKPIForm, setShowCustomKPIForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState<CustomKPI | null>(null);

  // Custom KPI form state
  const [customKPIForm, setCustomKPIForm] = useState<Partial<CustomKPI>>({
    name: '',
    description: '',
    icon: '📊',
    color: '#3B82F6',
    section: 'business',
    dataSource: 'calculated',
    calculation: '',
    format: 'number'
  });

  useEffect(() => {
    loadAvailableKPIs();
  }, [selectedTemplate]);

  const loadAvailableKPIs = () => {
    let kpis: KPIOption[] = [];

    if (selectedTemplate) {
      // Load KPIs from selected template
      const template = getTemplateById(selectedTemplate);
      if (template) {
        Object.entries(template.categories).forEach(([section, definitions]) => {
          definitions.forEach(definition => {
            kpis.push({
              ...definition,
              section,
              templateName: template.name,
              enabled: template.defaultEnabled.includes(definition.id)
            });
          });
        });
      }
    } else {
      // Load all available KPIs from all templates
      const templates = ['ecommerce', 'saas']; // Add more as needed
      templates.forEach(templateId => {
        const template = getTemplateById(templateId);
        if (template) {
          Object.entries(template.categories).forEach(([section, definitions]) => {
            definitions.forEach(definition => {
              kpis.push({
                ...definition,
                section,
                templateName: template.name,
                enabled: false
              });
            });
          });
        }
      });
    }

    setAvailableKPIs(kpis);
    
    // Set initial selections based on template defaults
    const initiallyEnabled = kpis.filter(kpi => kpi.enabled).map(kpi => kpi.id);
    setSelectedKPIs(initiallyEnabled);
  };

  const filteredKPIs = availableKPIs.filter(kpi => {
    const matchesSearch = kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kpi.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = filterSection === 'all' || kpi.section === filterSection;
    const matchesDataSource = filterDataSource === 'all' || kpi.dataSource === filterDataSource;
    
    return matchesSearch && matchesSection && matchesDataSource;
  });

  const groupedKPIs = filteredKPIs.reduce((acc, kpi) => {
    if (!acc[kpi.section]) acc[kpi.section] = [];
    acc[kpi.section].push(kpi);
    return acc;
  }, {} as Record<string, KPIOption[]>);

  const toggleKPI = (kpiId: string) => {
    setSelectedKPIs(prev => 
      prev.includes(kpiId) 
        ? prev.filter(id => id !== kpiId)
        : [...prev, kpiId]
    );
  };

  const handleCustomKPISave = () => {
    if (!customKPIForm.name || !customKPIForm.calculation) return;

    const newKPI: CustomKPI = {
      id: `custom_${Date.now()}`,
      name: customKPIForm.name!,
      description: customKPIForm.description || '',
      icon: customKPIForm.icon!,
      color: customKPIForm.color!,
      section: customKPIForm.section!,
      dataSource: customKPIForm.dataSource!,
      calculation: customKPIForm.calculation!,
      format: customKPIForm.format!,
      target: customKPIForm.target,
      benchmark: customKPIForm.benchmark
    };

    if (editingKPI) {
      setCustomKPIs(prev => prev.map(kpi => 
        kpi.id === editingKPI.id ? { ...newKPI, id: editingKPI.id } : kpi
      ));
    } else {
      setCustomKPIs(prev => [...prev, newKPI]);
    }

    resetCustomKPIForm();
  };

  const resetCustomKPIForm = () => {
    setCustomKPIForm({
      name: '',
      description: '',
      icon: '📊',
      color: '#3B82F6',
      section: 'business',
      dataSource: 'calculated',
      calculation: '',
      format: 'number'
    });
    setEditingKPI(null);
    setShowCustomKPIForm(false);
  };

  const removeCustomKPI = (kpiId: string) => {
    setCustomKPIs(prev => prev.filter(kpi => kpi.id !== kpiId));
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'acquisition': return '📢';
      case 'engagement': return '💡';
      case 'retention': return '🔄';
      case 'business': return '💰';
      default: return '📊';
    }
  };

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'acquisition': return 'ACQUISITION';
      case 'engagement': return 'ENGAGEMENT';
      case 'retention': return 'RETENTION';
      case 'business': return 'BUSINESS';
      default: return section.toUpperCase();
    }
  };

  const getDataSourceColor = (dataSource: string) => {
    switch (dataSource) {
      case 'google_ads': return 'bg-blue-100 text-blue-800';
      case 'ga4': return 'bg-green-100 text-green-800';
      case 'mixpanel': return 'bg-purple-100 text-purple-800';
      case 'calculated': return 'bg-orange-100 text-orange-800';
      case 'platform': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderKPICard = (kpi: KPIOption) => {
    const isSelected = selectedKPIs.includes(kpi.id);
    
    return (
      <div
        key={kpi.id}
        onClick={() => toggleKPI(kpi.id)}
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{kpi.icon}</span>
            <div>
              <h4 className="font-medium text-gray-900">{kpi.name}</h4>
              {kpi.templateName && (
                <span className="text-xs text-gray-500">from {kpi.templateName}</span>
              )}
            </div>
          </div>
          {isSelected && (
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-3">{kpi.description}</p>

        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getDataSourceColor(kpi.dataSource)}`}>
            {kpi.dataSource.replace('_', ' ')}
          </span>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {kpi.benchmark && (
              <span className="flex items-center">
                <Target size={12} className="mr-1" />
                {kpi.benchmark}
              </span>
            )}
            {kpi.alerts && (
              <AlertTriangle size={12} className="text-yellow-500" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCustomKPIForm = () => (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {editingKPI ? 'Edit Custom KPI' : 'Create Custom KPI'}
        </h3>
        <button
          onClick={resetCustomKPIForm}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">KPI Name *</label>
          <input
            type="text"
            value={customKPIForm.name}
            onChange={(e) => setCustomKPIForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Custom Conversion Rate"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <input
            type="text"
            value={customKPIForm.description}
            onChange={(e) => setCustomKPIForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of what this measures"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Section</label>
          <select
            value={customKPIForm.section}
            onChange={(e) => setCustomKPIForm(prev => ({ ...prev, section: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="acquisition">📢 Acquisition</option>
            <option value="engagement">💡 Engagement</option>
            <option value="retention">🔄 Retention</option>
            <option value="business">💰 Business</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Data Source</label>
          <select
            value={customKPIForm.dataSource}
            onChange={(e) => setCustomKPIForm(prev => ({ ...prev, dataSource: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="google_ads">Google Ads</option>
            <option value="ga4">Google Analytics</option>
            <option value="mixpanel">Mixpanel</option>
            <option value="calculated">Calculated</option>
            <option value="platform">Platform Data</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Format</label>
          <select
            value={customKPIForm.format}
            onChange={(e) => setCustomKPIForm(prev => ({ ...prev, format: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="number">Number</option>
            <option value="currency">Currency</option>
            <option value="percentage">Percentage</option>
            <option value="duration">Duration</option>
            <option value="ratio">Ratio</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Icon</label>
          <input
            type="text"
            value={customKPIForm.icon}
            onChange={(e) => setCustomKPIForm(prev => ({ ...prev, icon: e.target.value }))}
            placeholder="📊"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Calculation Formula *</label>
          <input
            type="text"
            value={customKPIForm.calculation}
            onChange={(e) => setCustomKPIForm(prev => ({ ...prev, calculation: e.target.value }))}
            placeholder="e.g., conversions / sessions * 100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Target (Optional)</label>
          <input
            type="number"
            value={customKPIForm.target || ''}
            onChange={(e) => setCustomKPIForm(prev => ({ ...prev, target: parseFloat(e.target.value) || undefined }))}
            placeholder="Target value"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Benchmark (Optional)</label>
          <input
            type="number"
            value={customKPIForm.benchmark || ''}
            onChange={(e) => setCustomKPIForm(prev => ({ ...prev, benchmark: parseFloat(e.target.value) || undefined }))}
            placeholder="Industry benchmark"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={resetCustomKPIForm}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleCustomKPISave}
          disabled={!customKPIForm.name || !customKPIForm.calculation}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {editingKPI ? 'Update KPI' : 'Create KPI'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`kpi-builder ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customize Your KPI Dashboard</h2>
            <p className="text-gray-600">
              Select KPIs from templates or create your own custom metrics
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {selectedKPIs.length + customKPIs.length} KPIs selected
          </span>
          <button
            onClick={() => onSave(selectedKPIs, customKPIs)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Dashboard
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search KPIs..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sections</option>
            <option value="acquisition">Acquisition</option>
            <option value="engagement">Engagement</option>
            <option value="retention">Retention</option>
            <option value="business">Business</option>
          </select>

          <select
            value={filterDataSource}
            onChange={(e) => setFilterDataSource(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sources</option>
            <option value="google_ads">Google Ads</option>
            <option value="ga4">Google Analytics</option>
            <option value="mixpanel">Mixpanel</option>
            <option value="calculated">Calculated</option>
            <option value="platform">Platform</option>
          </select>
        </div>

        <button
          onClick={() => setShowCustomKPIForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Plus size={16} />
          <span>Create Custom KPI</span>
        </button>
      </div>

      {/* Custom KPI Form */}
      {showCustomKPIForm && renderCustomKPIForm()}

      {/* Custom KPIs List */}
      {customKPIs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Your Custom KPIs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customKPIs.map(kpi => (
              <div key={kpi.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{kpi.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{kpi.name}</h4>
                      <span className="text-xs text-green-600">Custom KPI</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingKPI(kpi);
                        setCustomKPIForm(kpi);
                        setShowCustomKPIForm(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      onClick={() => removeCustomKPI(kpi.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{kpi.description}</p>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getDataSourceColor(kpi.dataSource)}`}>
                  {kpi.dataSource.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available KPIs by Section */}
      <div className="space-y-8">
        {Object.entries(groupedKPIs).map(([section, kpis]) => (
          <div key={section} className="section-group">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">{getSectionIcon(section)}</span>
              <h3 className="text-xl font-semibold text-gray-900">{getSectionTitle(section)}</h3>
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-500">
                {kpis.filter(kpi => selectedKPIs.includes(kpi.id)).length} of {kpis.length} selected
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.map(renderKPICard)}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredKPIs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs Found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default CustomKPIBuilder;