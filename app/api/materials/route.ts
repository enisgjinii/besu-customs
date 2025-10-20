import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

type MaterialSection = {
  id: string;
  name: string;
  originalName: string;
  category: string;
  color: string;
  roughness: number;
  metalness: number;
  wireframe: boolean;
  customTexture?: string | null;
  trimDesign?: string; // For trim line designs
  combinedOriginalNames?: string[]; // For combined sections like stoppers
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const modelParam = url.searchParams.get('model');
  if (!modelParam) {
    return NextResponse.json({ error: 'model query param required' }, { status: 400 });
  }

  // Normalize model path to a filename used by the extractor
  // e.g. /models/Baseball caps.glb -> public_models_Baseball caps.glb-material-names-simple.txt
  const projectRoot = path.resolve('.');
  const relative = modelParam.replace(/^\//, '').replace(/\\/g, '/');
  const safe = `public_${relative.replace(/\//g, '_')}-material-names-simple.txt`;
  const filePath = path.join(projectRoot, 'materials-output', safe);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'precomputed file not found', file: filePath }, { status: 404 });
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Function to rename sections for specific models
  const renameSectionForModel = (originalName: string): string | null => {
    // Baseball Cap renaming
    if (modelParam.includes('Baseball caps.glb')) {
      if (originalName === 'Default Topstitch_2473') return 'Stitching Color';
      if (originalName === 'Strap_2456') return 'Strap Color';
      if (originalName === 'Brim_2452') return 'Brim Color';
      if (originalName === 'Cap Main_2447') return 'Main Cap Color';
      if (originalName === 'Default Button_2458') return 'Button Color';
    }

    // Baseball Jersey renaming
    if (modelParam.includes('Baseball-Jersey.glb')) {
      if (originalName === 'Body_B_3794820') return 'Back Jersey Color';
      if (originalName === 'Body_F_3732324') return 'Front Jersey Color';
      if (originalName === 'Button_1_3732346') return 'All Buttons Color';
      if (originalName === 'Default_Button_3683977') return 'Top Button Color';
      if (originalName === 'Default_Button_3683978') return 'Button Stitching Color';
      if (originalName === 'Collar_Stand_4150782') return 'Jersey Collar Color';
      if (originalName === 'Sleeves_4023608') return 'Arm Sleeves Color';
    }

    // Basketball Jersey Top And Long Shorts renaming
    if (modelParam.includes('Basketball Jersey Top And Long Shorts.glb')) {
      // FABRIC materials are actually the jersey parts
      if (originalName === 'FABRIC_1_2842') return 'Jersey Sleeve & Collar Trim Color';
      if (originalName === 'FABRIC_1_2845') return 'Back of Jersey Color';
      if (originalName === 'FABRIC_1_2848') return 'Front of Jersey Color';
      if (originalName === 'FABRIC_1_66694') return 'Jersey Side Panel Color';
      // Ble and Body materials are actually the shorts parts
      if (originalName === 'Ble_66685') return 'Shorts Waist Trim Color';
      if (originalName === 'Body_B_66682') return 'Back of Shorts Color';
      if (originalName === 'Body_F_66679') return 'Front of Shorts Color';
      // Remove buttons - they don't exist on basketball jerseys
      if (originalName === 'Default_Button_66696') return null;
      if (originalName === 'Default_Button_66697') return null;
    }

    // Basketball Jersey and Shorts renaming
    if (modelParam.includes('Basketball Jersey and Shorts.glb')) {
      if (originalName === 'Ble_4559165') return 'Sleeve and Collar Trim Color';
      if (originalName === 'Body_B_181847') return 'Back of Jersey Color';
      if (originalName === 'Body_F_144430') return 'Front of Jersey Color';
      if (originalName === 'FABRIC_1_11120073') return 'Back of Shorts Color';
      if (originalName === 'FABRIC_1_11352026') return 'Front of Shorts Color';
      // Remove buttons and buttonholes - they don't apply to basketball jerseys
      if (originalName === 'Default_Button_6792128') return null;
      if (originalName === 'Default_Button_6792130') return null;
      if (originalName === 'Default_Buttonhole_6792189') return null;
    }

    // Basketball shooting shirt long sleeve renaming
    if (modelParam.includes('basketball shooting shirt long sleeve without hoodie.glb')) {
      if (originalName === 'FABRIC 1_85769026') return 'Base Color';
    }

    // Basketball shooting shirt with hoodie renaming
    if (modelParam.includes('basketball shooting shirt short sleeve with hoodie.glb')) {
      if (originalName === 'FABRIC 1_10070542') return 'Base Color';
      if (originalName === 'Zipper 4_TapeFabric_10234985') return 'Zipper Outline';
      if (originalName === 'Zipper 4_Teeth_10235089') return 'Zipper Teeth Color';
      if (originalName === 'X 1_10070714') return 'Collar & Top of Hoodie Stitching Color';
      if (originalName === 'X 2_10070836') return 'Hoodie Face Stitching Color';
      // Keep these as they are
      if (originalName === 'Zipper 4_Slider_10235018') return 'Zipper Slider';
      if (originalName === 'Zipper 4_Puller_10235037') return 'Zipper Puller';
      // Combine top stoppers into one
      if (originalName === 'Zipper 4_TopStopper_10235055') return 'Zipper Top Stopper';
      if (originalName === 'Zipper 4_TopStopper_10235057') return 'Zipper Top Stopper';
      // Combine bottom stoppers into one
      if (originalName === 'Zipper 4_BottomStopper_10235075') return 'Zipper Bottom Stopper';
      if (originalName === 'Zipper 4_BottomStopper_10235077') return 'Zipper Bottom Stopper';
      // Remove cord ends as they don't change anything
      if (originalName === 'Cord end_01_10233876') return null;
      if (originalName === 'Cord end_01_10233907') return null;
      // Handle trim
      if (originalName === 'Trim_11533042_10233969') return 'Trim Color';
    }

    // Basketball shooting shirt short sleeve renaming  
    if (modelParam.includes('basketball shooting shirt, short sleeve without a hoodie.glb')) {
      if (originalName === 'Body_F_83787749') return 'Front of Shirt Color';
      if (originalName === 'Body_F_83966863') return 'Collar Color';  // This actually controls the collar visually
      if (originalName === 'Body_B_83815280') return 'Back of Shirt Color';  // This actually controls the back visually
      if (originalName === 'Sleeves_83893597') return 'Sleeves';
    }

    // Backpack renaming
    if (modelParam.includes('Backpack.glb')) {
      if (originalName === 'FABRIC 2_612766') return 'Backpack Color';
    }

    // Hoodie renaming
    if (modelParam.includes('Hoodie.glb')) {
      if (originalName === 'FABRIC_1_607462') return 'Main Hoodie Color';
    }

    // Long Pants (Long Shorts) renaming
    if (modelParam.includes('long pants.glb')) {
      if (originalName === 'Material.001') return 'Back of Shorts Color';
      if (originalName === 'FABRIC_1_11352026') return 'Front of Shorts Color';
      if (originalName === 'FABRIC_1_1271') return 'Waist Color';
    }

    // Polo Long Sleeve renaming
    if (modelParam.includes('Polo shirts long sleeve.glb')) {
      if (originalName === 'Body_B_18747644') return 'Back of Polo Long Sleeve Shirt Color';
      if (originalName === 'Body_F_18571006') return 'Front of Polo Long Sleeve Shirt Color';
      if (originalName === 'Bodyr_F_Placket_18571012') return 'Placket Color';
      if (originalName === 'Button_1_18571034') return 'Button Color';
      if (originalName === 'FABRIC_1_18569862') return 'Cuff Color';
      if (originalName === 'Collar_18686026') return 'Collar Color';
      if (originalName === 'Sleeves_18920289') return 'Arm Sleeves Color';
    }

    // Polo Short Sleeve renaming
    if (modelParam.includes('Polo shirts short sleeve.glb')) {
      if (originalName === 'Body_B_17912114') return 'Back of Polo Shirt';
      if (originalName === 'Body_F_17850235') return 'Front of Polo Shirt';
      if (originalName === 'Bodyr_F_Placket_17850241') return 'Placket of Polo Shirt';
      if (originalName === 'Button_1_17850263') return 'Button Color';
      if (originalName === 'Collar_18104863') return 'Neck Collar Color';
      if (originalName === 'Sleeves_18006264') return 'Arm Sleeves Color';
    }

    // Soccer Jersey Crew Neck renaming
    if (modelParam.includes('Soccer jersey crew neck.glb')) {
      if (originalName === 'Body_B_301116') return 'Jersey Back Color';
      if (originalName === 'Body_F_279881') return 'Jersey Front Color';
      if (originalName === 'Collar_Stand_441436') return 'Jersey Collar Color';
      if (originalName === 'Sleeves_365053') return 'Jersey Sleeves Color';
    }

    // Soccer Jersey V Neck renaming
    if (modelParam.includes('Soccer jersey v-neck.glb')) {
      if (originalName === 'Body_14111705') return 'Jersey Front Color';
      if (originalName === 'Body_14135701') return 'Jersey Back Color';
      if (originalName === 'Body_14258581') return 'Jersey V-Neck Color';
      if (originalName === 'FABRIC_1_14406325') return 'Shorts Front Color';
      if (originalName === 'FABRIC_1_14482374') return 'Shorts Back Color';
      if (originalName === 'FABRIC_1_14572429') return 'Shorts Waist Color';
      if (originalName === 'Sleeves_14199335') return 'Jersey Arm Sleeve Color';
    }

    // Standard Bottom Cut Cuffed (Baseball Pants) renaming
    if (modelParam.includes('Standard bottom cut, cuffed.glb')) {
      if (originalName === 'Material.001') return 'Button Color';
      if (originalName === 'Default_Button_46243') return 'Button Stitching Color';
      if (originalName === 'Default_Buttonhole_46302') return 'Buttonhole Color';
      if (originalName === 'FABRIC_1_1530') return 'Bottom Cuff Color';
      if (originalName === 'FABRIC_1_233514') return 'Back of Pants Color';
      if (originalName === 'FABRIC_1_46217') return 'Waist Color';
      if (originalName === 'FABRIC_1_83591') return 'Front of Pants Color';
    }

    // Track and Field Compression Shorts renaming
    if (modelParam.includes('Track and field compression shorts.glb')) {
      if (originalName === 'FABRIC 1_2587') return 'Front of Shorts Color';
      if (originalName === 'FABRIC 1_2590') return 'Waist of Shorts Color';
      if (originalName === 'FABRIC 1_2593') return 'Back of Shorts Color';
    }

    // Track and Field Mid-Length Shorts renaming
    if (modelParam.includes('Track and field mid-len gth shorts.glb')) {
      if (originalName === 'FABRIC 1_85695338') return 'Waist of Shorts Color';
      if (originalName === 'FABRIC 1_85695335') return 'Front of Shorts Color';
      if (originalName === 'FABRIC 1_85695341') return 'Back of Shorts Color';
    }

    // Track and Field Split Shorts renaming
    if (modelParam.includes('Track and field split shorts.glb')) {
      if (originalName === 'FABRIC 1_2587') return 'Front of Shorts Color';
      if (originalName === 'FABRIC 1_2590') return 'Waist of Shorts Color';
      if (originalName === 'FABRIC 1_2593') return 'Back of Shorts Color';
    }

    // Track and Field Crop Top renaming
    if (modelParam.includes('Track and field top crop top.glb')) {
      if (originalName === 'Body_10697153') return 'Front of Crop Top Color';
      if (originalName === 'Body_10792617') return 'Back of Crop Top Color';
    }

    // Track and Field Short Sleeve renaming
    if (modelParam.includes('Track and field top short sleeve.glb')) {
      if (originalName === 'Body_F_465647') return 'Front of Shirt Color';
      if (originalName === 'Body_F_465656') return 'Neck Collar of Shirt Color';
      if (originalName === 'Body_B_465650') return 'Back of Shirt Color';
      if (originalName === 'Sleeves_465653') return 'Shirt Arm Sleeves Color';
    }

    // Track and Field Tank Top renaming
    if (modelParam.includes('Track and field top tank top.glb')) {
      if (originalName === 'Body_4659223') return 'Front of Tank Top Color';
      if (originalName === 'Body_4717163') return 'Back of Tank Top Color';
    }

    // Volleyball Long Sleeve Tops renaming
    if (modelParam.includes('Volleyball long sleeve tops.glb')) {
      if (originalName === 'Sleeves_FRONT_4165') return 'Front of Shirt Color';
      if (originalName === 'Body_FRONT_4160') return 'Back of Shirt Color';
    }

    // Volleyball Short Sleeve Tops renaming
    if (modelParam.includes('Volleyball short sleeve tops.glb')) {
      if (originalName === 'Body_1486550') return 'Jersey Neck Collar Color';
      if (originalName === 'Body_1337391') return 'Arm Sleeve & Bottom Trim Color';
      if (originalName === 'Body_1355687') return 'Back of Jersey Color';
      if (originalName === 'Material.001') return 'Front of Jersey Color';
    }

    // Volleyball Shorts Spandex 4 (Long Length) renaming
    if (modelParam.includes('Volleyball shorts spandex 4.glb')) {
      if (originalName === 'Default_Topstitch_1426721') return 'Inseam of Shorts Stitching Color 1';
      if (originalName === 'Default_Topstitch_1426725') return 'Inseam of Shorts Stitching Color 2';
      if (originalName === 'Default_Topstitch_1427150') return 'Inseam of Shorts Stitching Color 3';
      if (originalName === 'FABRIC_1_1426700') return 'Front of Shorts Color';
      if (originalName === 'FABRIC_1_1426703') return 'Back of Shorts Color';
      if (originalName === 'FABRIC_1_1426706') return 'Waist of Shorts Color';
    }

    // Volleyball Shorts Spandex (Small Length) renaming
    if (modelParam.includes('Volleyball shorts spandex.glb')) {
      if (originalName === 'FABRIC 1_2587') return 'Front of Shorts Color';
      if (originalName === 'FABRIC 1_2590') return 'Waist of Shorts Color';
      if (originalName === 'FABRIC 1_2593') return 'Back of Shorts Color';
    }

    // Volleyball Spandex (Medium Length) renaming
    if (modelParam.includes('Volleyball spandex.glb')) {
      if (originalName === 'Material.001') return 'Front of Shorts Color';
      if (originalName === 'FABRIC_1_2835') return 'Waist of Shorts Color';
      if (originalName === 'FABRIC_1_2838') return 'Back of Shorts Color';
    }

    // Half Short renaming
    if (modelParam.includes('Half short.glb')) {
      if (originalName === 'Material.001') return 'Shorts Front Color';  // Material.001 is Front
      if (originalName === 'FABRIC_1_2590') return 'Shorts Back Color';  // FABRIC_1_2590 is Back
      if (originalName === 'FABRIC_1_2587') return 'Shorts Waist Color';  // FABRIC_1_2587 is Waist
    }

    // Flag Football Top with Hoodie renaming
    if (modelParam.includes('Flag football top with hoodie.glb')) {
      if (originalName === 'FABRIC 1_10070542') return 'Football Jersey Main Color';
      if (originalName === 'Zipper 4_TapeFabric_10234985') return 'Zipper Outline Color';
      if (originalName === 'Zipper 4_Teeth_10235089') return 'Zipper Teeth Color';
      if (originalName === 'X 1_10070714') return 'Neck Collar, Top of Hoodie, and Side of Jersey Stitching Color';
      if (originalName === 'X 2_10070836') return 'Hoodie Face Area Stitching Color';
      if (originalName === 'Zipper 4_Slider_10235018') return 'Zipper Slider Color';
      if (originalName === 'Zipper 4_Puller_10235037') return 'Zipper Puller Color';
      if (originalName === 'Zipper 4_TopStopper_10235055') return 'Zipper Top Stopper Color Left Side';
      if (originalName === 'Zipper 4_TopStopper_10235057') return 'Zipper Top Stopper Color Right Side';
      if (originalName === 'Zipper 4_BottomStopper_10235075') return 'Zipper Bottom Stopper Color Left Side';
      if (originalName === 'Zipper 4_BottomStopper_10235077') return 'Zipper Bottom Stopper Color Right Side';
      if (originalName === 'FABRIC_1_2587') return 'Shorts Waist Color';
      if (originalName === 'FABRIC_1_2590') return 'Shorts Back Color';
      if (originalName === 'Material.001') return 'Shorts Front Color';
      if (originalName === 'Trim_11533042_10233938') return 'Trim Color';
      // Remove cord ends as they don't change anything
      if (originalName === 'Cord end_01_10233876') return null;
      if (originalName === 'Cord end_01_10233907') return null;
    }

    // Backpack renaming
    if (modelParam.includes('Backpack.glb')) {
      if (originalName === 'FABRIC_3_79203') return 'Front of Backpack & Straps Color';
      if (originalName === 'FABRIC_4_79209') return 'Back of Backpack, Straps, and Grab Handle Color';
      if (originalName === 'M_00005_156729') return 'Bottom Zipper Color';
      if (originalName === 'M_00005_156760') return 'Top Left Zipper Color';
      if (originalName === 'M_00005_156791') return 'Top Right Zipper Color';
      if (originalName === 'M_00018_156636') return 'Left Slider Color';
      if (originalName === 'M_00018_156667') return 'Right Slider Color';
      if (originalName === 'Zipper_Teeth_01_79381') return 'Zipper Teeth';
      if (originalName === '79499') return 'Strap Stitching Color';
      if (originalName === '79612') return 'Total Backpack Stitching Color';
      if (originalName === '79725') return 'Back of Backpack Stitching Color';
      // Remove materials that don't change anything
      if (originalName === 'Material5104_78706') return null;  // Unknown/doesn't edit anything
      if (originalName === 'Slider_01_156698') return null;  // Doesn't change
      if (originalName === 'Slider_01_156822') return null;  // Doesn't change
      if (originalName === 'Slider_01_156853') return null;  // Doesn't change
    }

    return originalName;
  };

  // Function to assign categories for specific models
  const getCategoryForSection = (originalName: string): string => {
    // Basketball Jersey Top And Long Shorts categories (corrected mapping)
    if (modelParam.includes('Basketball Jersey Top And Long Shorts.glb')) {
      // FABRIC_1_ materials are actually the jersey parts
      if (originalName.includes('FABRIC_1_')) return 'Jersey';
      // Body_ and Ble_ materials are actually the shorts parts
      if (originalName.includes('Body_') || originalName === 'Ble_66685') return 'Shorts';
      return 'Other';
    }

    // Basketball Jersey and Shorts categories
    if (modelParam.includes('Basketball Jersey and Shorts.glb')) {
      // Body_ and Ble_ materials are the jersey parts
      if (originalName.includes('Body_') || originalName === 'Ble_4559165') return 'Jersey';
      // FABRIC_1_ materials are the shorts parts
      if (originalName.includes('FABRIC_1_')) return 'Shorts';
      return 'Other';
    }

    // Basketball shooting shirt long sleeve categories
    if (modelParam.includes('basketball shooting shirt long sleeve without hoodie.glb')) {
      return 'Long Sleeve Shooting Shirt';
    }

    // Basketball shooting shirt with hoodie categories
    if (modelParam.includes('basketball shooting shirt short sleeve with hoodie.glb')) {
      return 'Basketball Shooting Shirt with Hoodie';
    }

    // Basketball shooting shirt short sleeve categories
    if (modelParam.includes('basketball shooting shirt, short sleeve without a hoodie.glb')) {
      return 'Basketball Shooting Shirt Short Sleeve';
    }

    // Backpack categories
    if (modelParam.includes('Backpack.glb')) {
      return 'Backpack';
    }

    // Hoodie categories
    if (modelParam.includes('Hoodie.glb')) {
      return 'Hoodie Color Selection';
    }

    // Long Pants (Long Shorts) categories
    if (modelParam.includes('long pants.glb')) {
      return 'Long Shorts Color Selection';
    }

    // Polo Long Sleeve categories
    if (modelParam.includes('Polo shirts long sleeve.glb')) {
      if (originalName === 'Button_1_18571034' || originalName === 'FABRIC_1_18569862') {
        return 'Button & Cuff Color';
      }
      return 'Polo Long Sleeve Shirt';
    }

    // Polo Short Sleeve categories
    if (modelParam.includes('Polo shirts short sleeve.glb')) {
      if (originalName === 'Button_1_17850263') {
        return 'Button Color';
      }
      return 'Short Sleeve Polo Shirt';
    }

    // Soccer Jersey Crew Neck categories
    if (modelParam.includes('Soccer jersey crew neck.glb')) {
      return 'Soccer Jersey Crew Neck';
    }

    // Soccer Jersey V Neck categories
    if (modelParam.includes('Soccer jersey v-neck.glb')) {
      if (originalName.includes('FABRIC_1_')) {
        return 'Shorts Colors';
      }
      return 'Soccer Jersey V Neck';
    }

    // Standard Bottom Cut Cuffed (Baseball Pants) categories
    if (modelParam.includes('Standard bottom cut, cuffed.glb')) {
      return 'Baseball Pants Colors';
    }

    // Track and Field Compression Shorts categories
    if (modelParam.includes('Track and field compression shorts.glb')) {
      return 'Track Shorts Color';
    }

    // Track and Field Mid-Length Shorts categories
    if (modelParam.includes('Track and field mid-len gth shorts.glb')) {
      return 'Track Shorts Color';
    }

    // Track and Field Split Shorts categories
    if (modelParam.includes('Track and field split shorts.glb')) {
      return 'Split Shorts Color';
    }

    // Track and Field Crop Top categories
    if (modelParam.includes('Track and field top crop top.glb')) {
      return 'Crop Top Color';
    }

    // Track and Field Short Sleeve categories
    if (modelParam.includes('Track and field top short sleeve.glb')) {
      return 'Track and Field Short Sleeve';
    }

    // Track and Field Tank Top categories
    if (modelParam.includes('Track and field top tank top.glb')) {
      return 'Tank Top Colors';
    }

    // Volleyball Long Sleeve Tops categories
    if (modelParam.includes('Volleyball long sleeve tops.glb')) {
      return 'Volleyball Shirt Colors';
    }

    // Volleyball Short Sleeve Tops categories
    if (modelParam.includes('Volleyball short sleeve tops.glb')) {
      return 'Volleyball Jersey Color';
    }

    // Volleyball Shorts Spandex 4 (Long Length) categories
    if (modelParam.includes('Volleyball shorts spandex 4.glb')) {
      return 'Volley Ball Shorts Color Options';
    }

    // Volleyball Shorts Spandex (Small Length) categories
    if (modelParam.includes('Volleyball shorts spandex.glb')) {
      return 'Volleyball Shorts Color Options';
    }

    // Volleyball Spandex (Medium Length) categories
    if (modelParam.includes('Volleyball spandex.glb')) {
      return 'Volleyball Shorts Color Options';
    }

    // Half Short categories
    if (modelParam.includes('Half short.glb')) {
      return 'Half Size Shorts';
    }

    // Flag Football Top with Hoodie categories
    if (modelParam.includes('Flag football top with hoodie.glb')) {
      if (originalName.includes('FABRIC') && !originalName.includes('Zipper')) return 'Jersey & Shorts';
      if (originalName.includes('Zipper') || originalName.includes('X ')) return 'Hoodie & Zipper';
      return 'Other';
    }

    // Baseball Caps categories
    if (modelParam.includes('Baseball caps.glb')) {
      return 'Baseball Cap Colors';
    }

    // Backpack categories
    if (modelParam.includes('Backpack.glb')) {
      return 'Backpack';
    }

    return 'Other';
  };

  // Function to reorder sections for specific models
  const reorderSectionsForModel = (sections: MaterialSection[]): MaterialSection[] => {
    if (modelParam.includes('Baseball-Jersey.glb')) {
      const reordered = [...sections];
      const frontIndex = reordered.findIndex(s => s.originalName === 'Body_F_3732324');
      const backIndex = reordered.findIndex(s => s.originalName === 'Body_B_3794820');

      if (frontIndex !== -1 && backIndex !== -1 && frontIndex > backIndex) {
        // Swap front and back so front comes first
        [reordered[frontIndex], reordered[backIndex]] = [reordered[backIndex], reordered[frontIndex]];
      }
      return reordered;
    }

    if (modelParam.includes('Basketball Jersey Top And Long Shorts.glb')) {
      const reordered = [...sections];

      // Define the desired order: Jersey sections first (Front, Back, Trim, Side), then Shorts sections (Front, Back, Waist)
      const desiredOrder = [
        'FABRIC_1_2848', // Front of Jersey Color
        'FABRIC_1_2845', // Back of Jersey Color  
        'FABRIC_1_2842', // Jersey Sleeve & Collar Trim Color
        'FABRIC_1_66694', // Jersey Side Panel Color
        'Body_F_66679',  // Front of Shorts Color
        'Body_B_66682',  // Back of Shorts Color
        'Ble_66685'      // Shorts Waist Trim Color
      ];

      const orderedSections: MaterialSection[] = [];

      // Add sections in the desired order
      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      // Add any remaining sections that weren't in the desired order
      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Flag football top with hoodie.glb')) {
      const reordered = [...sections];

      // Define the desired order: Jersey Main, Shorts Front, Shorts Back, Shorts Waist, then others
      const desiredOrder = [
        'FABRIC 1_10070542', // Football Jersey Main Color
        'Material.001',      // Shorts Front Color (moved to top)
        'FABRIC_1_2590',     // Shorts Back Color
        'FABRIC_1_2587'      // Shorts Waist Color
      ];

      const orderedSections: MaterialSection[] = [];

      // Add sections in the desired order
      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      // Add any remaining sections that weren't in the desired order
      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('long pants.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Waist
      const desiredOrder = [
        'FABRIC_1_11352026',  // Front of Shorts Color (display first)
        'Material.001',       // Back of Shorts Color (display second)
        'FABRIC_1_1271'       // Waist Color (display third)
      ];

      const orderedSections: MaterialSection[] = [];

      // Add sections in the desired order
      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      // Add any remaining sections that weren't in the desired order
      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Half short.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Waist
      const desiredOrder = [
        'Material.001',    // Shorts Front Color (display first)
        'FABRIC_1_2590',   // Shorts Back Color (display second)
        'FABRIC_1_2587'    // Shorts Waist Color (display third)
      ];

      const orderedSections: MaterialSection[] = [];

      // Add sections in the desired order
      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      // Add any remaining sections that weren't in the desired order
      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Polo shirts long sleeve.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Sleeves, Collar, Placket, Button, Cuff
      const desiredOrder = [
        'Body_F_18571006',          // Front of Polo Long Sleeve Shirt Color
        'Body_B_18747644',          // Back of Polo Long Sleeve Shirt Color
        'Sleeves_18920289',         // Arm Sleeves Color
        'Collar_18686026',          // Collar Color
        'Bodyr_F_Placket_18571012', // Placket Color
        'Button_1_18571034',        // Button Color
        'FABRIC_1_18569862'         // Cuff Color
      ];

      const orderedSections: MaterialSection[] = [];

      // Add sections in the desired order
      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      // Add any remaining sections that weren't in the desired order
      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Polo shirts short sleeve.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Sleeves, Collar, Placket, Button
      const desiredOrder = [
        'Body_F_17850235',          // Front of Polo Shirt
        'Body_B_17912114',          // Back of Polo Shirt
        'Sleeves_18006264',         // Arm Sleeves Color
        'Collar_18104863',          // Neck Collar Color
        'Bodyr_F_Placket_17850241', // Placket of Polo Shirt
        'Button_1_17850263'         // Button Color
      ];

      const orderedSections: MaterialSection[] = [];

      // Add sections in the desired order
      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      // Add any remaining sections that weren't in the desired order
      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Soccer jersey crew neck.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Sleeves, Collar
      const desiredOrder = [
        'Body_F_279881',      // Jersey Front Color
        'Body_B_301116',      // Jersey Back Color
        'Sleeves_365053',     // Jersey Sleeves Color
        'Collar_Stand_441436' // Jersey Collar Color
      ];

      const orderedSections: MaterialSection[] = [];

      // Add sections in the desired order
      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      // Add any remaining sections that weren't in the desired order
      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Soccer jersey v-neck.glb')) {
      const reordered = [...sections];

      // Define the desired order: Jersey sections first (Front, Back, Sleeves, V-Neck), then Shorts sections (Front, Back, Waist)
      const desiredOrder = [
        'Body_14111705',      // Jersey Front Color
        'Body_14135701',      // Jersey Back Color
        'Sleeves_14199335',   // Jersey Arm Sleeve Color (moved up for better UX)
        'Body_14258581',      // Jersey V-Neck Color
        'FABRIC_1_14406325',  // Shorts Front Color
        'FABRIC_1_14482374',  // Shorts Back Color
        'FABRIC_1_14572429'   // Shorts Waist Color
      ];

      const orderedSections: MaterialSection[] = [];

      // Add sections in the desired order
      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      // Add any remaining sections that weren't in the desired order
      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Standard bottom cut, cuffed.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Waist, Bottom Cuff, Button, Button Stitching, Buttonhole
      const desiredOrder = [
        'FABRIC_1_83591',         // Front of Pants Color
        'FABRIC_1_233514',        // Back of Pants Color
        'FABRIC_1_46217',         // Waist Color
        'FABRIC_1_1530',          // Bottom Cuff Color
        'Material.001',           // Button Color
        'Default_Button_46243',   // Button Stitching Color
        'Default_Buttonhole_46302' // Buttonhole Color
      ];

      const orderedSections: MaterialSection[] = [];

      // Add sections in the desired order
      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      // Add any remaining sections that weren't in the desired order
      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Track and field compression shorts.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Waist
      const desiredOrder = [
        'FABRIC 1_2587',  // Front of Shorts Color
        'FABRIC 1_2593',  // Back of Shorts Color
        'FABRIC 1_2590'   // Waist of Shorts Color
      ];

      const orderedSections: MaterialSection[] = [];

      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Track and field mid-len gth shorts.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Waist
      const desiredOrder = [
        'FABRIC 1_85695335',  // Front of Shorts Color
        'FABRIC 1_85695341',  // Back of Shorts Color
        'FABRIC 1_85695338'   // Waist of Shorts Color
      ];

      const orderedSections: MaterialSection[] = [];

      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Track and field split shorts.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Waist
      const desiredOrder = [
        'FABRIC 1_2587',  // Front of Shorts Color
        'FABRIC 1_2593',  // Back of Shorts Color
        'FABRIC 1_2590'   // Waist of Shorts Color
      ];

      const orderedSections: MaterialSection[] = [];

      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Track and field top short sleeve.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Sleeves, Collar
      const desiredOrder = [
        'Body_F_465647',  // Front of Shirt Color
        'Body_B_465650',  // Back of Shirt Color
        'Sleeves_465653', // Shirt Arm Sleeves Color
        'Body_F_465656'   // Neck Collar of Shirt Color
      ];

      const orderedSections: MaterialSection[] = [];

      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Volleyball short sleeve tops.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Neck Collar, Arm & Bottom Trim
      const desiredOrder = [
        'Material.001',   // Front of Jersey Color
        'Body_1355687',   // Back of Jersey Color
        'Body_1486550',   // Jersey Neck Collar Color
        'Body_1337391'    // Arm Sleeve & Bottom Trim Color
      ];

      const orderedSections: MaterialSection[] = [];

      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Volleyball shorts spandex 4.glb')) {
      const reordered = [...sections];

      // Define the desired order: Primary colors first (Front, Back, Waist), then Inseam stitching
      const desiredOrder = [
        'FABRIC_1_1426700',         // Front of Shorts Color
        'FABRIC_1_1426703',         // Back of Shorts Color
        'FABRIC_1_1426706',         // Waist of Shorts Color
        'Default_Topstitch_1426721', // Inseam of Shorts Stitching Color 1
        'Default_Topstitch_1426725', // Inseam of Shorts Stitching Color 2
        'Default_Topstitch_1427150'  // Inseam of Shorts Stitching Color 3
      ];

      const orderedSections: MaterialSection[] = [];

      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Volleyball shorts spandex.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Waist
      const desiredOrder = [
        'FABRIC 1_2587',  // Front of Shorts Color
        'FABRIC 1_2593',  // Back of Shorts Color
        'FABRIC 1_2590'   // Waist of Shorts Color
      ];

      const orderedSections: MaterialSection[] = [];

      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Volleyball spandex.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Waist
      const desiredOrder = [
        'Material.001',    // Front of Shorts Color
        'FABRIC_1_2838',   // Back of Shorts Color
        'FABRIC_1_2835'    // Waist of Shorts Color
      ];

      const orderedSections: MaterialSection[] = [];

      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('Basketball Jersey and Shorts.glb')) {
      const reordered = [...sections];

      // Define the desired order: Jersey sections first (Front, Back, Trim), then Shorts sections (Front, Back)
      const desiredOrder = [
        'Body_F_144430',      // Front of Jersey Color
        'Body_B_181847',      // Back of Jersey Color  
        'Ble_4559165',        // Sleeve and Collar Trim Color
        'FABRIC_1_11352026',  // Front of Shorts Color
        'FABRIC_1_11120073'   // Back of Shorts Color
      ];

      const orderedSections: MaterialSection[] = [];

      // Add sections in the desired order
      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      // Add any remaining sections that weren't in the desired order
      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    if (modelParam.includes('basketball shooting shirt, short sleeve without a hoodie.glb')) {
      const reordered = [...sections];

      // Define the desired order: Front, Back, Collar, Sleeves
      const desiredOrder = [
        'Body_F_83787749',  // Front of Shirt Color
        'Body_B_83815280',  // Back of Shirt Color (swapped position)
        'Body_F_83966863',  // Collar Color (swapped position)
        'Sleeves_83893597'  // Sleeves
      ];

      const orderedSections: MaterialSection[] = [];

      // Add sections in the desired order
      for (const originalName of desiredOrder) {
        const section = reordered.find(s => s.originalName === originalName);
        if (section) {
          orderedSections.push(section);
        }
      }

      // Add any remaining sections that weren't in the desired order
      for (const section of reordered) {
        if (!orderedSections.find(s => s.originalName === section.originalName)) {
          orderedSections.push(section);
        }
      }

      return orderedSections;
    }

    return sections;
  };

  // Convert to minimal MaterialSection[] compatible with the store
  let sections: MaterialSection[] = lines
    .filter((name) => {
      const renamedName = renameSectionForModel(name);
      return renamedName !== null; // Filter out removed sections
    })
    .map((name, idx) => ({
      id: `pre_${idx}_${name.replace(/\s+/g, '_')}`,
      name: renameSectionForModel(name)!,
      originalName: name,
      category: getCategoryForSection(name),
      color: '#cccccc',
      roughness: 0.5,
      metalness: 0.0,
      wireframe: false,
      customTexture: null,
    }));

  // Handle combined sections for Basketball shooting shirt with hoodie
  if (modelParam.includes('basketball shooting shirt short sleeve with hoodie.glb')) {
    // Group sections with the same name (combined stoppers)
    const groupedSections = new Map<string, MaterialSection[]>();

    sections.forEach(section => {
      const key = section.name;
      if (!groupedSections.has(key)) {
        groupedSections.set(key, []);
      }
      groupedSections.get(key)!.push(section);
    });

    // Create final sections, keeping only one instance of each combined section
    sections = Array.from(groupedSections.entries()).map(([name, sectionGroup]) => {
      // For combined sections, use the first one but store all original names for material mapping
      const primarySection = sectionGroup[0];
      if (sectionGroup.length > 1) {
        // This is a combined section - we'll handle the material mapping in the model loader
        primarySection.combinedOriginalNames = sectionGroup.map(s => s.originalName);
      }
      return primarySection;
    });
  }

  // Reorder sections if needed
  sections = reorderSectionsForModel(sections);

  // Add trim line options for Baseball Jersey
  if (modelParam.includes('Baseball-Jersey.glb')) {
    const trimSections: MaterialSection[] = [
      {
        id: 'trim_front_lines',
        name: 'Front Trim Lines',
        originalName: 'Front Trim Lines',
        category: 'Trim Options',
        color: '#ffffff',
        roughness: 0.3,
        metalness: 0.0,
        wireframe: false,
        customTexture: null,
        trimDesign: undefined,
      },
      {
        id: 'trim_sleeve_lines',
        name: 'Sleeve Trim Lines',
        originalName: 'Sleeve Trim Lines',
        category: 'Trim Options',
        color: '#ffffff',
        roughness: 0.3,
        metalness: 0.0,
        wireframe: false,
        customTexture: null,
        trimDesign: undefined,
      }
    ];
    sections.push(...trimSections);
  }

  // Add trim line options for Basketball Jersey and Shorts
  if (modelParam.includes('Basketball Jersey and Shorts.glb')) {
    const trimSections: MaterialSection[] = [
      {
        id: 'trim_jersey_side_lines',
        name: 'Jersey Side Trim Lines',
        originalName: 'Jersey Side Trim Lines',
        category: 'Trim Options',
        color: '#ffffff',
        roughness: 0.3,
        metalness: 0.0,
        wireframe: false,
        customTexture: null,
        trimDesign: undefined,
      }
    ];
    sections.push(...trimSections);
  }

  return NextResponse.json({ sections });
}
