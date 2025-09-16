"use client";

import React, { useState, useEffect } from 'react';
import { Check, Sparkles, TrendingUp, Users, ShoppingCart, DollarSign, Zap, GraduationCap, Building2, Truck, Smartphone, Heart } from 'lucide-react';

interface KPITemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  industries: string[];
  kpiCount: number;
  categories: {
    acquisition: string[];
    engagement: string[];
    retention: string[];
    business: string[];
  };
  preview: {
    acquisition: number;
    engagement: number;
    retention: number;
    business: number;
  };
  popular?: boolean;
  recommended?: boolean;
}

interface KPITemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string, template: KPITemplate) => void;
  onCustomize: () => void;
  className?: string;
}

const KPITemplateSelector: React.FC<KPITemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  onCustomize,
  className = ''
}) => {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  
  const templates: KPITemplate[] = [
    {
      id: 'ecommerce',
      name: 'E-commerce',
      description: 'Online retail, marketplaces, D2C brands',
      icon: <ShoppingCart size={24} />,
      color: '#10B981',
      bgColor: '#F0FDF4',
      industries: ['Retail', 'D2C', 'Marketplace'],
      kpiCount: 16,
      categories: {
        acquisition: ['Traffic', 'Ad Spend', 'CAC', 'Conversion Rate'],
        engagement: ['Session Duration', 'Pages/Session', 'Cart Add Rate', 'Product Views'],
        retention: ['Repeat Purchase', 'Customer LTV', 'Churn Rate', 'Loyalty Score'],
        business: ['Revenue', 'ROAS', 'AOV', 'Profit Margins']
      },
      preview: { acquisition: 6, engagement: 4, retention: 3, business: 3 },
      popular: true
    },
    {
      id: 'saas',
      name: 'SaaS',
      description: 'Software as a Service, subscription platforms',
      icon: <Building2 size={24} />,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      industries: ['Software', 'Tech', 'B2B'],
      kpiCount: 18,
      categories: {
        acquisition: ['Trial Signups', 'Lead Quality', 'Demo Requests', 'Organic Traffic'],
        engagement: ['Feature Adoption', 'Session Frequency', 'User Actions', 'Support Tickets'],
        retention: ['Monthly Churn', 'Expansion Revenue', 'Net Retention', 'User Health Score'],
        business: ['MRR', 'ARR', 'LTV/CAC', 'Gross Margins']
      },
      preview: { acquisition: 4, engagement: 5, retention: 4, business: 5 },
      recommended: true
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      description: 'Two-sided platforms, peer-to-peer networks',
      icon: <Users size={24} />,
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      industries: ['Marketplace', 'P2P', 'Gig Economy'],
      kpiCount: 20,
      categories: {
        acquisition: ['Supplier Growth', 'Buyer Acquisition', 'Two-Sided CAC', 'Network Effects'],
        engagement: ['Transaction Volume', 'Match Rate', 'Time to Transaction', 'Search Success'],
        retention: ['Repeat Transactions', 'Supplier/Buyer Retention', 'Cross-Side Value', 'Liquidity'],
        business: ['Take Rate', 'GMV', 'Network Density', 'Unit Economics']
      },
      preview: { acquisition: 6, engagement: 5, retention: 4, business: 5 }
    },
    {
      id: 'fintech',
      name: 'Fintech',
      description: 'Financial services, payments, lending',
      icon: <DollarSign size={24} />,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      industries: ['Finance', 'Payments', 'Lending'],
      kpiCount: 15,
      categories: {
        acquisition: ['Account Signups', 'KYC Completion', 'First Deposit', 'Referral Rate'],
        engagement: ['Transaction Frequency', 'Product Usage', 'App Sessions', 'Feature Adoption'],
        retention: ['Monthly Active Users', 'Account Dormancy', 'Product Stickiness', 'Loyalty'],
        business: ['Revenue per User', 'Net Interest Margin', 'Risk Metrics', 'Compliance Score']
      },
      preview: { acquisition: 4, engagement: 4, retention: 3, business: 4 }
    },
    {
      id: 'mobile_app',
      name: 'Mobile App',
      description: 'iOS/Android apps, gaming, social platforms',
      icon: <Smartphone size={24} />,
      color: '#EF4444',
      bgColor: '#FEF2F2',
      industries: ['Mobile', 'Gaming', 'Social'],
      kpiCount: 17,
      categories: {
        acquisition: ['App Downloads', 'Install Rate', 'Organic vs Paid', 'Store Ranking'],
        engagement: ['Daily Active Users', 'Session Length', 'Screen Flow', 'Push Open Rate'],
        retention: ['Day 1/7/30 Retention', 'App Uninstall', 'Feature Retention', 'User Journey'],
        business: ['In-App Purchases', 'Ad Revenue', 'ARPU', 'LTV']
      },
      preview: { acquisition: 4, engagement: 5, retention: 4, business: 4 },
      popular: true
    },
    {
      id: 'media',
      name: 'Media & Content',
      description: 'Publishing, streaming, content platforms',
      icon: <Heart size={24} />,
      color: '#EC4899',
      bgColor: '#FDF2F8',
      industries: ['Media', 'Publishing', 'Entertainment'],
      kpiCount: 14,
      categories: {
        acquisition: ['Unique Visitors', 'Content Discovery', 'Social Shares', 'SEO Traffic'],
        engagement: ['Time on Site', 'Content Consumption', 'User Generated Content', 'Comments'],
        retention: ['Return Visitors', 'Subscriber Growth', 'Content Loyalty', 'Community Engagement'],
        business: ['Ad Revenue', 'Subscription Revenue', 'Content ROI', 'Creator Economics']
      },
      preview: { acquisition: 4, engagement: 4, retention: 3, business: 3 }
    },
    {
      id: 'edutech',
      name: 'EdTech',
      description: 'Education technology, online learning, courses',
      icon: <GraduationCap size={24} />,
      color: '#06B6D4',
      bgColor: '#F0F9FF',
      industries: ['Education', 'Training', 'Certification'],
      kpiCount: 16,
      categories: {
        acquisition: ['Student Enrollment', 'Course Discovery', 'Free Trial Conversion', 'Referrals'],
        engagement: ['Course Completion', 'Learning Time', 'Assignment Submission', 'Forum Activity'],
        retention: ['Course Retention', 'Student Progression', 'Certification Rate', 'Re-enrollment'],
        business: ['Revenue per Student', 'Course Profitability', 'Teacher Utilization', 'Content ROI']
      },
      preview: { acquisition: 4, engagement: 4, retention: 4, business: 4 }
    },
    {
      id: 'supply_chain',
      name: 'Supply Chain',
      description: 'Logistics, inventory, B2B operations',
      icon: <Truck size={24} />,
      color: '#64748B',
      bgColor: '#F8FAFC',
      industries: ['Logistics', 'Manufacturing', 'B2B'],
      kpiCount: 13,
      categories: {
        acquisition: ['Partner Onboarding', 'Supplier Growth', 'Channel Development', 'Lead Quality'],
        engagement: ['Order Frequency', 'Platform Usage', 'Integration Depth', 'Support Usage'],
        retention: ['Partner Retention', 'Order Consistency', 'Contract Renewals', 'Relationship Score'],
        business: ['Revenue per Partner', 'Operational Efficiency', 'Cost Savings', 'SLA Performance']
      },
      preview: { acquisition: 3, engagement: 3, retention: 3, business: 4 }
    }
  ];

  const getTemplateCard = (template: KPITemplate, isSelected: boolean, isHovered: boolean) => (
    <div
      key={template.id}
      onClick={() => onTemplateSelect(template.id, template)}
      onMouseEnter={() => setHoveredTemplate(template.id)}
      onMouseLeave={() => setHoveredTemplate(null)}
      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : isHovered
          ? 'border-gray-300 bg-gray-50 shadow-md'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{ 
        backgroundColor: isSelected ? template.bgColor : undefined,
        borderColor: isSelected ? template.color : undefined
      }}
    >
      {/* Template Badge */}
      {(template.popular || template.recommended) && (
        <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium ${
          template.popular ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          {template.popular ? '🔥 Popular' : '⭐ Recommended'}
        </div>
      )}

      {/* Selection Check */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Check size={14} className="text-white" />
          </div>
        </div>
      )}

      {/* Template Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div 
          className="p-3 rounded-lg"
          style={{ 
            backgroundColor: template.bgColor,
            color: template.color 
          }}
        >
          {template.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
          <p className="text-sm text-gray-600">{template.description}</p>
        </div>
      </div>

      {/* KPI Categories Preview */}
      <div className="space-y-3 mb-4">
        {Object.entries(template.categories).map(([category, kpis]) => (
          <div key={category} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium capitalize">{category}:</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {template.preview[category as keyof typeof template.preview]} KPIs
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Template Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <TrendingUp size={14} />
          <span>{template.kpiCount} Total KPIs</span>
        </div>
        <div className="flex items-center space-x-1">
          {template.industries.slice(0, 2).map((industry, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
              {industry}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`kpi-template-selector ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="text-blue-500" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Choose Your KPI Dashboard Template</h2>
        </div>
        <p className="text-gray-600">
          Select an industry template to get started quickly, or create a custom dashboard from scratch.
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          const isHovered = hoveredTemplate === template.id;
          return getTemplateCard(template, isSelected, isHovered);
        })}

        {/* Custom Template Option */}
        <div
          onClick={onCustomize}
          className="p-6 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center text-center min-h-[300px]"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Zap size={24} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Dashboard</h3>
          <p className="text-sm text-gray-600 mb-4">
            Build your own KPI dashboard from scratch with our drag & drop builder.
          </p>
          <div className="text-xs text-blue-600 font-medium">
            Start Building →
          </div>
        </div>
      </div>

      {/* Selected Template Preview */}
      {selectedTemplate && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">
            {templates.find(t => t.id === selectedTemplate)?.name} Template Preview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(templates.find(t => t.id === selectedTemplate)?.categories || {}).map(([category, kpis]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">
                    {category === 'acquisition' && '📢'}
                    {category === 'engagement' && '💡'}
                    {category === 'retention' && '🔄'}
                    {category === 'business' && '💰'}
                  </span>
                  <h4 className="font-semibold capitalize">{category}</h4>
                </div>
                <ul className="space-y-1">
                  {kpis.slice(0, 4).map((kpi, idx) => (
                    <li key={idx} className="text-sm text-gray-600">• {kpi}</li>
                  ))}
                  {kpis.length > 4 && (
                    <li className="text-xs text-gray-500">+ {kpis.length - 4} more</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KPITemplateSelector;