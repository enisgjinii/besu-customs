#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listModels() {
  const { data, error } = await supabase
    .from('models')
    .select('name, file_path')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📋 Models in database:\n');
  data.forEach(model => {
    console.log(`Name: "${model.name}"`);
    console.log(`Path: ${model.file_path}\n`);
  });
  console.log(`Total: ${data.length} models`);
}

listModels();
