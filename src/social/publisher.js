import { exportContentToDownloads } from "./exportPackage.js";
import { SOCIAL_CONTENT_STATUS } from "./socialTypes.js";

export async function exportApprovedContent(content) {
  const pkg = await exportContentToDownloads(content);
  return {
    success: true,
    mode: "export",
    status: SOCIAL_CONTENT_STATUS.EXPORTED,
    package: pkg,
  };
}
