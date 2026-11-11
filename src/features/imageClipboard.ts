const IMAGE_TYPES:Record<string,string>={
 'image/png':'png','image/jpeg':'jpg','image/webp':'webp',
 'image/gif':'gif','image/avif':'avif','image/bmp':'bmp',
};
export function pastedFiles(data:DataTransfer|null){
 if(!data)return [];
 const files=data.files?.length?Array.from(data.files):Array.from(data.items||[])
  .filter(item=>item.kind==='file').map(item=>item.getAsFile()).filter((file):file is File=>!!file);
 return files.map((file,index)=>file.name?file:new File([file],`imagen-pegada-${Date.now()}-${index}.${IMAGE_TYPES[file.type]||'png'}`,{type:file.type||'image/png'}));
}

// Called only from an explicit tap. Never reads the clipboard on mount or focus.
export async function readClipboardImages(clipboard:Pick<Clipboard,'read'>|undefined=globalThis.navigator?.clipboard){
 if(globalThis.isSecureContext===false||!clipboard?.read)throw Error('clipboard-unavailable');
 const items=await clipboard.read();
 const images=items.map(item=>({item,type:Object.keys(IMAGE_TYPES).find(type=>item.types.includes(type))})).filter(entry=>!!entry.type);
 if(!images.length)throw Error('clipboard-no-images');
 if(images.length>10)throw Error('clipboard-too-many');
 const files:File[]=[];
 for(const {item,type} of images){
  const blob=await item.getType(type!);
  if(!blob.size)throw Error('clipboard-empty-image');
  files.push(new File([blob],`imagen-pegada-${Date.now()}-${files.length}.${IMAGE_TYPES[type!]}`,{type:type!}));
 }
 return files;
}

export function clipboardImageError(error:unknown){
 const message=error instanceof Error?error.message:'';
 if(message==='clipboard-unavailable')return 'Este navegador no permite pegar imágenes con este botón. Mantén pulsado el cuadro del mensaje y elige Pegar, o adjunta la foto.';
 if(message==='clipboard-no-images')return 'No hay imágenes compatibles en el portapapeles. Copia una imagen y vuelve a intentarlo.';
 if(message==='clipboard-too-many')return 'Puedes pegar hasta diez imágenes por envío.';
 if(error instanceof Error&&['NotAllowedError','SecurityError'].includes(error.name))return 'No se permitió acceder al portapapeles. Autoriza el acceso al volver a intentarlo, o mantén pulsado el cuadro del mensaje y elige Pegar.';
 return 'No se pudo pegar la imagen. Vuelve a copiarla e inténtalo de nuevo, o adjunta la foto.';
}
