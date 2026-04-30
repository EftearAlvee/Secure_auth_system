import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);

if (process.env.EMAIL_PASS) {
  console.log('EMAIL_PASS (first 4):', process.env.EMAIL_PASS.substring(0, 4));
}
