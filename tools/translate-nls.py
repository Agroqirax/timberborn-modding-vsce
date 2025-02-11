import json
import asyncio
import aiohttp
from deep_translator import GoogleTranslator


async def translate_text(session, text, source, target):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, GoogleTranslator(source=source, target=target).translate, text)


async def main():
    with open('package.nls.json') as f:
        data = json.load(f)

    dest_lang = input("Enter language code (e.g. en): ")

    async with aiohttp.ClientSession() as session:
        translations = await asyncio.gather(
            *(translate_text(session, data[key], 'en', dest_lang) for key in data)
        )

    translated_data = {key: translations[i]
                       for i, key in enumerate(data.keys())}

    with open(f'package.nls.{dest_lang}.json', 'w') as f:
        json.dump(translated_data, f, indent=4)

if __name__ == "__main__":
    asyncio.run(main())
