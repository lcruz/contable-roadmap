#!/usr/bin/env node
/**
 * Script to convert all YAML roadmaps in roadmaps/ folder to JSON
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface RoadmapData {
  [key: string]: {
    title: string;
    description: string;
    resources?: Array<{
      type: string;
      title: string;
      url: string;
    }>;
  };
}

function isRoadmapData(obj: any): obj is RoadmapData {
  if (!obj || typeof obj !== 'object') return false;
  
  // Check if at least one key has a structure like { title, description, ... }
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  
  // Check if the first key has title and description (typical roadmap structure)
  const firstKey = keys[0];
  const firstValue = obj[firstKey];
  
  return (
    firstValue &&
    typeof firstValue === 'object' &&
    'title' in firstValue &&
    'description' in firstValue
  );
}

function extractRoadmapData(yamlData: any): RoadmapData | null {
  if (!yamlData || typeof yamlData !== 'object') {
    return null;
  }

  // If the data is already a roadmap structure, return it
  if (isRoadmapData(yamlData)) {
    return yamlData;
  }

  // If there's a wrapper key (like roadmap_emprender, ventas_y_marketing, etc.)
  // and its value is a roadmap structure, extract it
  const keys = Object.keys(yamlData);
  
  if (keys.length === 0) {
    return null;
  }
  
  // If there's only one top-level key and its value is a roadmap structure
  if (keys.length === 1) {
    const wrapperValue = yamlData[keys[0]];
    if (isRoadmapData(wrapperValue)) {
      return wrapperValue;
    }
  }
  
  // Try to find any key that contains roadmap data
  for (const key of keys) {
    const value = yamlData[key];
    if (isRoadmapData(value)) {
      return value;
    }
  }

  // Fallback: if we can't find a roadmap structure, return null
  return null;
}

function convertYamlToJson(yamlFile: string, jsonFile: string): boolean {
  try {
    // Read YAML file
    const yamlContent = fs.readFileSync(yamlFile, 'utf-8');
    
    if (!yamlContent || yamlContent.trim().length === 0) {
      console.error(`✗ Error: File ${yamlFile} is empty`);
      return false;
    }
    
    const yamlData = yaml.load(yamlContent);

    if (!yamlData) {
      console.error(`✗ Error: Failed to parse YAML from ${yamlFile}`);
      return false;
    }

    // Extract roadmap data (handles wrappers automatically)
    const jsonData = extractRoadmapData(yamlData);

    if (!jsonData) {
      console.error(`✗ Error: Failed to extract roadmap data from ${yamlFile}`);
      return false;
    }

    // Write JSON file with pretty formatting
    fs.writeFileSync(
      jsonFile,
      JSON.stringify(jsonData, null, 2) + '\n',
      'utf-8'
    );

    console.log(`✓ Successfully converted ${yamlFile} to ${jsonFile}`);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.error(`✗ Error: File ${yamlFile} not found`);
      } else {
        console.error(`✗ Error converting ${yamlFile}: ${error.message}`);
        if (error.stack) {
          console.error(`  Stack: ${error.stack}`);
        }
      }
    } else {
      console.error(`✗ Error converting ${yamlFile}: ${error}`);
    }
    return false;
  }
}

function convertAllYamlFiles(roadmapsDir: string): void {
  try {
    // Check if roadmaps directory exists
    if (!fs.existsSync(roadmapsDir)) {
      console.error(`✗ Error: Directory ${roadmapsDir} not found`);
      process.exit(1);
    }

    // Read all files in the directory
    const files = fs.readdirSync(roadmapsDir);
    
    // Filter only .yaml files
    const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    
    if (yamlFiles.length === 0) {
      console.log(`No YAML files found in ${roadmapsDir}`);
      return;
    }

    console.log(`Found ${yamlFiles.length} YAML file(s) to convert:\n`);

    let successCount = 0;
    let failCount = 0;

    // Convert each YAML file
    for (const yamlFile of yamlFiles) {
      const yamlPath = path.join(roadmapsDir, yamlFile);
      const jsonFile = yamlFile.replace(/\.ya?ml$/i, '.json');
      const jsonPath = path.join(roadmapsDir, jsonFile);

      const success = convertYamlToJson(yamlPath, jsonPath);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Conversion complete: ${successCount} succeeded, ${failCount} failed`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`✗ Error: ${error.message}`);
    } else {
      console.error(`✗ Error: ${error}`);
    }
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

// If arguments are provided, use them (backward compatibility)
if (args.length > 0) {
  const yamlFile = args[0];
  const jsonFile = args[1] || yamlFile.replace(/\.ya?ml$/i, '.json');
  const success = convertYamlToJson(yamlFile, jsonFile);
  process.exit(success ? 0 : 1);
} else {
  // Default: convert all YAML files in roadmaps/ directory
  const roadmapsDir = path.join(process.cwd(), 'roadmaps');
  convertAllYamlFiles(roadmapsDir);
  process.exit(0);
}



