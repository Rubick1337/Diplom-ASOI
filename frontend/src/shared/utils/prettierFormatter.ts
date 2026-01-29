import * as prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserEstree from "prettier/plugins/estree";
import parserTypeScript from "prettier/plugins/typescript";

export const formatCodeLocal = async (language: string, code: string): Promise<string | null> => {
    const supportedLanguages = ['javascript', 'typescript'];

    if (supportedLanguages.includes(language)) {
        try {
            const parser = language === 'typescript' ? 'typescript' : 'babel';

            return await prettier.format(code, {
                parser: parser,
                plugins: [parserBabel, parserEstree, parserTypeScript],
                semi: true,
                singleQuote: true,
                tabWidth: 4,
                printWidth: 80,
            });
        } catch (e: any) {
            console.warn("Локальное форматирование не удалось:", e.message);
            return null;
        }
    }
    return null;
};