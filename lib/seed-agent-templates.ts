import { createClient } from '@supabase/supabase-js';

// Create admin client for seeding operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
import { customerSupportAgents } from '@/lib/agent-templates/customer-support-agents';
import { salesAgents } from '@/lib/agent-templates/sales-agents';
import { specializedAgents } from '@/lib/agent-templates/specialized-agents';
import { AgentTemplate } from '@/lib/agent-marketplace-service';

export interface SeedingOptions {
  overwriteExisting?: boolean;
  dryRun?: boolean;
  systemUserId?: string;
}

export interface SeedingResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  details: {
    templateId: string;
    name: string;
    action: 'created' | 'updated' | 'skipped' | 'error';
    error?: string;
  }[];
}

/**
 * Seeds the database with system agent templates
 * This should be run during deployment to populate the marketplace
 */
export async function seedAgentTemplates(options: SeedingOptions = {}): Promise<SeedingResult> {
  const {
    overwriteExisting = false,
    dryRun = false,
    systemUserId = 'system'
  } = options;

  console.log('🌱 Starting agent template seeding...');
  console.log(`Options: ${JSON.stringify(options)}`);

  const result: SeedingResult = {
    success: true,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    details: []
  };

  // Combine all static templates
  const allTemplates: AgentTemplate[] = [
    ...customerSupportAgents,
    ...salesAgents,
    ...specializedAgents
  ];

  console.log(`📋 Found ${allTemplates.length} templates to seed`);

  // Process each template
  for (const template of allTemplates) {
    try {
      console.log(`\n🔄 Processing: ${template.name} (${template.id})`);

      if (dryRun) {
        console.log(`   ✅ [DRY RUN] Would process template: ${template.name}`);
        result.details.push({
          templateId: template.id,
          name: template.name,
          action: 'created'
        });
        result.created++;
        continue;
      }

      // Check if template already exists
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('ai_agent_templates')
        .select('id, name, updated_at')
        .eq('id', template.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Failed to check existing template: ${checkError.message}`);
      }

      const templateData = {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        use_case: template.category, // Map category to use_case
        prompt_template: template.templateConfig.systemPrompt,
        configuration: template.templateConfig,
        creator_id: systemUserId,
        visibility: template.isPublic ? 'system' : 'private',
        price: template.price,
        downloads_count: template.usageCount,
        rating: template.rating,
        rating_count: template.reviewsCount,
        tags: template.tags,
        usage_limits: template.templateConfig.usageLimits,
        pricing_tier: template.price > 0 ? 'premium' : 'free',
        approval_status: 'approved',
        created_at: template.createdAt.toISOString(),
        updated_at: template.updatedAt.toISOString()
      };

      if (existing) {
        // Template exists
        if (overwriteExisting) {
          // Update existing template
          const { error: updateError } = await supabaseAdmin
            .from('ai_agent_templates')
            .update({
              ...templateData,
              updated_at: new Date().toISOString()
            })
            .eq('id', template.id);

          if (updateError) {
            throw new Error(`Failed to update template: ${updateError.message}`);
          }

          console.log(`   ✅ Updated: ${template.name}`);
          result.updated++;
          result.details.push({
            templateId: template.id,
            name: template.name,
            action: 'updated'
          });
        } else {
          // Skip existing template
          console.log(`   ⏭️  Skipped (already exists): ${template.name}`);
          result.skipped++;
          result.details.push({
            templateId: template.id,
            name: template.name,
            action: 'skipped'
          });
        }
      } else {
        // Create new template
        const { error: insertError } = await supabaseAdmin
          .from('ai_agent_templates')
          .insert(templateData);

        if (insertError) {
          throw new Error(`Failed to insert template: ${insertError.message}`);
        }

        console.log(`   ✅ Created: ${template.name}`);
        result.created++;
        result.details.push({
          templateId: template.id,
          name: template.name,
          action: 'created'
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`   ❌ Error processing ${template.name}: ${errorMessage}`);
      
      result.errors.push(`${template.name}: ${errorMessage}`);
      result.details.push({
        templateId: template.id,
        name: template.name,
        action: 'error',
        error: errorMessage
      });
    }
  }

  // Final results
  const hasErrors = result.errors.length > 0;
  result.success = !hasErrors;

  console.log('\n🏁 Seeding completed!');
  console.log(`📊 Results:`);
  console.log(`   ✅ Created: ${result.created}`);
  console.log(`   🔄 Updated: ${result.updated}`);
  console.log(`   ⏭️  Skipped: ${result.skipped}`);
  console.log(`   ❌ Errors: ${result.errors.length}`);

  if (hasErrors) {
    console.log(`\n❌ Errors encountered:`);
    result.errors.forEach(error => console.log(`   - ${error}`));
    result.success = false;
  }

  return result;
}

/**
 * Remove all system templates from the database
 * Useful for testing or cleaning up
 */
export async function clearSystemTemplates(dryRun: boolean = false): Promise<{
  success: boolean;
  deleted: number;
  errors: string[];
}> {
  console.log('🧹 Clearing system templates...');

  const allTemplates = [
    ...customerSupportAgents,
    ...salesAgents,
    ...specializedAgents
  ];

  const templateIds = allTemplates.map(t => t.id);

  if (dryRun) {
    console.log(`[DRY RUN] Would delete ${templateIds.length} templates`);
    return { success: true, deleted: templateIds.length, errors: [] };
  }

  try {
    const { error, count } = await supabaseAdmin
      .from('ai_agent_templates')
      .delete()
      .in('id', templateIds);

    if (error) {
      console.error('❌ Error clearing templates:', error.message);
      return { success: false, deleted: 0, errors: [error.message] };
    }

    console.log(`✅ Cleared ${count || 0} system templates`);
    return { success: true, deleted: count || 0, errors: [] };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error clearing templates:', errorMessage);
    return { success: false, deleted: 0, errors: [errorMessage] };
  }
}

/**
 * Validate that all system templates are properly seeded
 */
export async function validateSeededTemplates(): Promise<{
  success: boolean;
  found: number;
  missing: string[];
  invalid: string[];
}> {
  console.log('🔍 Validating seeded templates...');

  const allTemplates = [
    ...customerSupportAgents,
    ...salesAgents,
    ...specializedAgents
  ];

  const result = {
    success: true,
    found: 0,
    missing: [] as string[],
    invalid: [] as string[]
  };

  for (const template of allTemplates) {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_agent_templates')
        .select('id, name, visibility')
        .eq('id', template.id)
        .single();

      if (error || !data) {
        result.missing.push(`${template.name} (${template.id})`);
        continue;
      }

      if (data.visibility !== 'public' && data.visibility !== 'system') {
        result.invalid.push(`${template.name} is not public/system`);
        continue;
      }

      result.found++;
      
    } catch (error) {
      result.invalid.push(`${template.name}: validation error`);
    }
  }

  result.success = result.missing.length === 0 && result.invalid.length === 0;

  console.log(`📊 Validation Results:`);
  console.log(`   ✅ Found: ${result.found}/${allTemplates.length}`);
  console.log(`   ❌ Missing: ${result.missing.length}`);
  console.log(`   ⚠️  Invalid: ${result.invalid.length}`);

  if (result.missing.length > 0) {
    console.log(`Missing templates:`, result.missing);
  }

  if (result.invalid.length > 0) {
    console.log(`Invalid templates:`, result.invalid);
  }

  return result;
}