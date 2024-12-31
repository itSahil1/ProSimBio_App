
// src/lib/utils.ts
export const handleError = (error: any) => {
  if (error instanceof Error) {
    // Handle standard error object
    console.error("Error: " + error.message);
    throw new Error(`Error: ${error.message}`);
  } else if (typeof error === "string") {
    // Handle string error message
    console.error(error);
    throw new Error(`Error: ${error}`);
  } else if (typeof error === "object") {
    // Handle object errors (API response errors, for example)
    console.error("Error: ", error);
    throw new Error("An unknown error occurred");
  } else {
    console.error("An unexpected error occurred");
    throw new Error("An unexpected error occurred");
  }
};

export const resizeBase64Img = (
  base64Str: any,
  maxWidth = 100,
  maxHeight = 100,
) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d") as any;
      ctx.drawImage(img, 0, 0, width, height);

      const newBase64Str = canvas.toDataURL("image/jpeg", 0.7);
      resolve(newBase64Str);
    };
  });
};
