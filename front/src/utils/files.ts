import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

const downloadBlob = async (filename: string, content: string) => {
  const aElement = document.createElement("a");
  aElement.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(content),
  );
  aElement.setAttribute("download", filename);
  aElement.setAttribute("target", "_blank");
  aElement.click();
  aElement.remove();

  return `$DOWNLOAD/${filename}`;
};

// Capacitor API to write file
const nativeWriteFile = async (filename: string, content: string) => {
  const result = await Filesystem.writeFile({
    path: `${filename}`,
    data: content,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });

  return result.uri;
};

export const writeFile = (filename: string, content: string) =>
  Capacitor.getPlatform() === "web"
    ? downloadBlob(filename, content)
    : nativeWriteFile(filename, content);

// Web API
export const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
