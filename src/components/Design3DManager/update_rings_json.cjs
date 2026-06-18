const fs = require('fs');
const path = require('path');

const ringsJsonPath = 'c:\\Users\\bhavy\\HX-Viewer\\Live\\BeheytRing\\public\\data\\rings.json';
const publicDir = 'c:\\Users\\bhavy\\HX-Viewer\\Live\\BeheytRing\\public';

function hasDiamond(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    const buffer = fs.readFileSync(filePath);
    const magic = buffer.toString('utf8', 0, 4);
    if (magic !== 'glTF') return false;
    
    const chunkLength = buffer.readUInt32LE(12);
    const chunkType = buffer.readUInt32LE(16);
    if (chunkType !== 0x4E4F534A) return false;
    
    const jsonBuffer = buffer.slice(20, 20 + chunkLength);
    const gltf = JSON.parse(jsonBuffer.toString('utf8'));
    
    let found = false;
    if (gltf.meshes) {
      found = gltf.meshes.some(mesh => {
        const name = mesh.name || '';
        return /diamond/i.test(name) || /diam_centr/i.test(name);
      });
    }
    if (!found && gltf.nodes) {
      found = gltf.nodes.some(node => {
        const name = node.name || '';
        return /diamond/i.test(name) || /diam_centr/i.test(name);
      });
    }
    return found;
  } catch (e) {
    console.error('Error reading:', filePath, e.message);
    return false;
  }
}

const ringsData = JSON.parse(fs.readFileSync(ringsJsonPath, 'utf8'));

for (const colName of Object.keys(ringsData.rings)) {
  const collection = ringsData.rings[colName];
  for (const modelId of Object.keys(collection)) {
    if (modelId === 'collectionID' || modelId === 'id') continue;
    const model = collection[modelId];
    for (const varName of Object.keys(model)) {
      if (varName === 'collectionID' || varName === 'id') continue;
      const variation = model[varName];
      
      // Resolve GLB URL
      let modelUrl = variation.modelUrl;
      if (!modelUrl) {
        const formattedCol = colName.charAt(0).toUpperCase() + colName.slice(1);
        const formattedVar = varName.replace(/\s+/g, "");
        modelUrl = `/BehytRings/${formattedCol}/${modelId}/${formattedVar}/${modelId}_${varName}.glb`;
      }
      
      const glbPath = path.join(publicDir, modelUrl);
      const isDiamond = hasDiamond(glbPath);
      
      variation.isDiamond = isDiamond;
      console.log(`${colName} - ${modelId} - ${varName}: isDiamond=${isDiamond}`);
    }
  }
}

fs.writeFileSync(ringsJsonPath, JSON.stringify(ringsData, null, 4), 'utf8');
console.log('Successfully updated rings.json!');
