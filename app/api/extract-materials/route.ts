import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Run the extraction script
    const { stdout, stderr } = await execAsync('node scripts/extract-materials.js', {
      cwd: process.cwd()
    });
    
    if (stderr) {
      console.error('Extraction stderr:', stderr);
      return NextResponse.json({ 
        success: false, 
        error: stderr 
      }, { status: 500 });
    }
    
    console.log('Extraction stdout:', stdout);
    return NextResponse.json({ 
      success: true, 
      message: 'Materials extracted successfully! Check the materials-output directory.',
      output: stdout
    });
  } catch (error: any) {
    console.error('Error extracting materials:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}