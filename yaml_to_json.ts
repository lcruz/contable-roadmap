#!/usr/bin/env node
/**
 * Script to convert roadmap.yaml to roadmap.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface RoadmapData {
  [key: string]: {
    title: string;
    description: string;
    resources: Array<{
      type: string;
      title: string;
      url: string;
    }>;
  };
}

function convertYamlToJson(yamlFile: string, jsonFile: string): boolean {
  try {
    // Read YAML file
    const yamlContent = fs.readFileSync(yamlFile, 'utf-8');
    const yamlData = yaml.load(yamlContent) as { roadmap_emprender?: RoadmapData } | RoadmapData;

    // Extract roadmap_emprender content if it exists
    let jsonData: RoadmapData;
    if (yamlData && 'roadmap_emprender' in yamlData && yamlData.roadmap_emprender) {
      jsonData = yamlData.roadmap_emprender;
    } else {
      jsonData = yamlData as RoadmapData;
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
        console.error(`✗ Error: ${error.message}`);
      }
    } else {
      console.error(`✗ Error: ${error}`);
    }
    return false;
  }
}

// Main execution
const args = process.argv.slice(2);
const yamlFile = args[0] || 'roadmap.yaml';
const jsonFile = args[1] || 'roadmap.json';

const success = convertYamlToJson(yamlFile, jsonFile);
process.exit(success ? 0 : 1);

