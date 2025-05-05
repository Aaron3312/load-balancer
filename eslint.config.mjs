import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Verificar si estamos en entorno de build
const isBuildEnv = process.env.NODE_ENV === 'production' || process.env.ESLINT_DISABLE === 'true';

// Si estamos en build, usar reglas mínimas; si no, usar reglas completas
const eslintConfig = isBuildEnv 
  ? [] // Sin reglas durante el build
  : [...compat.extends("next/core-web-vitals", "next/typescript")];

export default eslintConfig;