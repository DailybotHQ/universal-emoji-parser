import { expect } from 'chai'
import uEmojiParser from '../src/index'

describe('Test emoji parser', () => {
  describe('Using default options', () => {
    it('should parse emojis from unicode', () => {
      // (1) Smile 😀
      let text: string = '😀'
      let result: string = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="😀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f600.svg"/>'
      )

      // (2) Smile with smiling eyes 😄
      text = '😄'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="😄" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f604.svg"/>'
      )

      // (3) Sunglasses 😎
      text = '😎'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/>'
      )
    })

    it('should parse emojis from shortcode', () => {
      // (1) Smile 🙂
      let text: string = ':smile:'
      let result: string = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="🙂" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f642.svg"/>'
      )

      // (2) Smile with smiling eyes 😄
      text = ':grinning_face_with_smiling_eyes:'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="😄" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f604.svg"/>'
      )

      // (3) Sunglasses 😎
      text = ':smiling_face_with_sunglasses:'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/>'
      )
    })

    it('should parse a sentence with emojis from emoji unicode and shortcode', () => {
      const text: string =
        'A lot of emojis: 😄 😆 😊 😃 ☺️ 😏 😍 😘 😚 😳 😌 😆 😁 😉 😜 😝 😀 😗 😙 😛 😴 😟 😦 😧 😮 😬 😕 😯 😑 😒 😅 😓 😥 😩 😔 😞 😖 😨 😰 😣 😢 😭 😂 😲 😱 :neckbeard: 😫 😠 😡 😤 😪 😋 😷 😎 😵 👿 😈 😐 😶 😇 👽 💛 💙 💜 ❤️ 💚 💔 💓 💗 💕 💞 💘 💖 ✨ ⭐️ 🌟 💫 💥 💥 💢 ❗️ ❓ ❕ ❔ 💤 💨 💦 🎶 🎵 🔥 💩 💩 💩 👍 👍 👎 👎 👌 👊 👊 ✊ ✌️ 👋 ✋ ✋ 👐 ☝️ 👇 👈 👉 🙌 🙏 👆 👏 💪 🤘 🖕 🚶 🏃 🏃 👫 👪 👬 👭 💃 👯 🙆 🙅 💁 🙋 👰 🙎 🙍 🙇 :couplekiss: 💑 💆 💇 💅 👦 👧 👩 👨 👶 👵 👴 👱 👲 👳 👷 👮 👼 👸 😺 😸 😻 😽 😼 🙀 😿 😹 😾 👹 👺 🙈 🙉 🙊 💂 💀 🐾 👄 💋 💧 👂 👀 👃 👅 💌 👤 👥 💬 💭'
      const result: string = uEmojiParser.parse(text)
      expect(result).to.be.a('string')
      expect(result).to.be.equal(
        'A lot of emojis: <img class="emoji" alt="😄" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f604.svg"/> <img class="emoji" alt="😆" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f606.svg"/> <img class="emoji" alt="😊" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60a.svg"/> <img class="emoji" alt="😃" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f603.svg"/> <img class="emoji" alt="☺️" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/263a.svg"/> <img class="emoji" alt="😏" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60f.svg"/> <img class="emoji" alt="😍" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60d.svg"/> <img class="emoji" alt="😘" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f618.svg"/> <img class="emoji" alt="😚" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f61a.svg"/> <img class="emoji" alt="😳" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f633.svg"/> <img class="emoji" alt="😌" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60c.svg"/> <img class="emoji" alt="😆" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f606.svg"/> <img class="emoji" alt="😁" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f601.svg"/> <img class="emoji" alt="😉" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f609.svg"/> <img class="emoji" alt="😜" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f61c.svg"/> <img class="emoji" alt="😝" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f61d.svg"/> <img class="emoji" alt="😀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f600.svg"/> <img class="emoji" alt="😗" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f617.svg"/> <img class="emoji" alt="😙" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f619.svg"/> <img class="emoji" alt="😛" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f61b.svg"/> <img class="emoji" alt="😴" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f634.svg"/> <img class="emoji" alt="😟" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f61f.svg"/> <img class="emoji" alt="😦" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f626.svg"/> <img class="emoji" alt="😧" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f627.svg"/> <img class="emoji" alt="😮" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f62e.svg"/> <img class="emoji" alt="😬" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f62c.svg"/> <img class="emoji" alt="😕" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f615.svg"/> <img class="emoji" alt="😯" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f62f.svg"/> <img class="emoji" alt="😑" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f611.svg"/> <img class="emoji" alt="😒" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f612.svg"/> <img class="emoji" alt="😅" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f605.svg"/> <img class="emoji" alt="😓" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f613.svg"/> <img class="emoji" alt="😥" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f625.svg"/> <img class="emoji" alt="😩" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f629.svg"/> <img class="emoji" alt="😔" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f614.svg"/> <img class="emoji" alt="😞" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f61e.svg"/> <img class="emoji" alt="😖" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f616.svg"/> <img class="emoji" alt="😨" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f628.svg"/> <img class="emoji" alt="😰" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f630.svg"/> <img class="emoji" alt="😣" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f623.svg"/> <img class="emoji" alt="😢" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f622.svg"/> <img class="emoji" alt="😭" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f62d.svg"/> <img class="emoji" alt="😂" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f602.svg"/> <img class="emoji" alt="😲" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f632.svg"/> <img class="emoji" alt="😱" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f631.svg"/> :neckbeard: <img class="emoji" alt="😫" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f62b.svg"/> <img class="emoji" alt="😠" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f620.svg"/> <img class="emoji" alt="😡" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f621.svg"/> <img class="emoji" alt="😤" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f624.svg"/> <img class="emoji" alt="😪" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f62a.svg"/> <img class="emoji" alt="😋" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60b.svg"/> <img class="emoji" alt="😷" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f637.svg"/> <img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/> <img class="emoji" alt="😵" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f635.svg"/> <img class="emoji" alt="👿" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f47f.svg"/> <img class="emoji" alt="😈" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f608.svg"/> <img class="emoji" alt="😐" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f610.svg"/> <img class="emoji" alt="😶" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f636.svg"/> <img class="emoji" alt="😇" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f607.svg"/> <img class="emoji" alt="👽" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f47d.svg"/> <img class="emoji" alt="💛" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f49b.svg"/> <img class="emoji" alt="💙" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f499.svg"/> <img class="emoji" alt="💜" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f49c.svg"/> <img class="emoji" alt="❤️" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2764.svg"/> <img class="emoji" alt="💚" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f49a.svg"/> <img class="emoji" alt="💔" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f494.svg"/> <img class="emoji" alt="💓" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f493.svg"/> <img class="emoji" alt="💗" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f497.svg"/> <img class="emoji" alt="💕" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f495.svg"/> <img class="emoji" alt="💞" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f49e.svg"/> <img class="emoji" alt="💘" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f498.svg"/> <img class="emoji" alt="💖" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f496.svg"/> <img class="emoji" alt="✨" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2728.svg"/> <img class="emoji" alt="⭐️" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2b50.svg"/> <img class="emoji" alt="🌟" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f31f.svg"/> <img class="emoji" alt="💫" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4ab.svg"/> <img class="emoji" alt="💥" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4a5.svg"/> <img class="emoji" alt="💥" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4a5.svg"/> <img class="emoji" alt="💢" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4a2.svg"/> <img class="emoji" alt="❗️" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2757.svg"/> <img class="emoji" alt="❓" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2753.svg"/> <img class="emoji" alt="❕" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2755.svg"/> <img class="emoji" alt="❔" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2754.svg"/> <img class="emoji" alt="💤" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4a4.svg"/> <img class="emoji" alt="💨" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4a8.svg"/> <img class="emoji" alt="💦" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4a6.svg"/> <img class="emoji" alt="🎶" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f3b6.svg"/> <img class="emoji" alt="🎵" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f3b5.svg"/> <img class="emoji" alt="🔥" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f525.svg"/> <img class="emoji" alt="💩" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4a9.svg"/> <img class="emoji" alt="💩" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4a9.svg"/> <img class="emoji" alt="💩" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4a9.svg"/> <img class="emoji" alt="👍" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f44d.svg"/> <img class="emoji" alt="👍" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f44d.svg"/> <img class="emoji" alt="👎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f44e.svg"/> <img class="emoji" alt="👎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f44e.svg"/> <img class="emoji" alt="👌" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f44c.svg"/> <img class="emoji" alt="👊" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f44a.svg"/> <img class="emoji" alt="👊" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f44a.svg"/> <img class="emoji" alt="✊" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/270a.svg"/> <img class="emoji" alt="✌️" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/270c.svg"/> <img class="emoji" alt="👋" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f44b.svg"/> <img class="emoji" alt="✋" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/270b.svg"/> <img class="emoji" alt="✋" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/270b.svg"/> <img class="emoji" alt="👐" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f450.svg"/> <img class="emoji" alt="☝️" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/261d.svg"/> <img class="emoji" alt="👇" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f447.svg"/> <img class="emoji" alt="👈" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f448.svg"/> <img class="emoji" alt="👉" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f449.svg"/> <img class="emoji" alt="🙌" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f64c.svg"/> <img class="emoji" alt="🙏" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f64f.svg"/> <img class="emoji" alt="👆" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f446.svg"/> <img class="emoji" alt="👏" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f44f.svg"/> <img class="emoji" alt="💪" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4aa.svg"/> <img class="emoji" alt="🤘" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f918.svg"/> <img class="emoji" alt="🖕" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f595.svg"/> <img class="emoji" alt="🚶" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f6b6.svg"/> <img class="emoji" alt="🏃" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f3c3.svg"/> <img class="emoji" alt="🏃" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f3c3.svg"/> <img class="emoji" alt="👫" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f46b.svg"/> <img class="emoji" alt="👪" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f46a.svg"/> <img class="emoji" alt="👬" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f46c.svg"/> <img class="emoji" alt="👭" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f46d.svg"/> <img class="emoji" alt="💃" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f483.svg"/> <img class="emoji" alt="👯" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f46f.svg"/> <img class="emoji" alt="🙆" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f646.svg"/> <img class="emoji" alt="🙅" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f645.svg"/> <img class="emoji" alt="💁" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f481.svg"/> <img class="emoji" alt="🙋" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f64b.svg"/> <img class="emoji" alt="👰" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f470.svg"/> <img class="emoji" alt="🙎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f64e.svg"/> <img class="emoji" alt="🙍" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f64d.svg"/> <img class="emoji" alt="🙇" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f647.svg"/> <img class="emoji" alt="💏" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f48f.svg"/> <img class="emoji" alt="💑" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f491.svg"/> <img class="emoji" alt="💆" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f486.svg"/> <img class="emoji" alt="💇" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f487.svg"/> <img class="emoji" alt="💅" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f485.svg"/> <img class="emoji" alt="👦" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f466.svg"/> <img class="emoji" alt="👧" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f467.svg"/> <img class="emoji" alt="👩" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f469.svg"/> <img class="emoji" alt="👨" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f468.svg"/> <img class="emoji" alt="👶" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f476.svg"/> <img class="emoji" alt="👵" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f475.svg"/> <img class="emoji" alt="👴" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f474.svg"/> <img class="emoji" alt="👱" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f471.svg"/> <img class="emoji" alt="👲" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f472.svg"/> <img class="emoji" alt="👳" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f473.svg"/> <img class="emoji" alt="👷" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f477.svg"/> <img class="emoji" alt="👮" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f46e.svg"/> <img class="emoji" alt="👼" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f47c.svg"/> <img class="emoji" alt="👸" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f478.svg"/> <img class="emoji" alt="😺" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f63a.svg"/> <img class="emoji" alt="😸" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f638.svg"/> <img class="emoji" alt="😻" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f63b.svg"/> <img class="emoji" alt="😽" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f63d.svg"/> <img class="emoji" alt="😼" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f63c.svg"/> <img class="emoji" alt="🙀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f640.svg"/> <img class="emoji" alt="😿" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f63f.svg"/> <img class="emoji" alt="😹" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f639.svg"/> <img class="emoji" alt="😾" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f63e.svg"/> <img class="emoji" alt="👹" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f479.svg"/> <img class="emoji" alt="👺" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f47a.svg"/> <img class="emoji" alt="🙈" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f648.svg"/> <img class="emoji" alt="🙉" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f649.svg"/> <img class="emoji" alt="🙊" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f64a.svg"/> <img class="emoji" alt="💂" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f482.svg"/> <img class="emoji" alt="💀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f480.svg"/> <img class="emoji" alt="🐾" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f43e.svg"/> <img class="emoji" alt="👄" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f444.svg"/> <img class="emoji" alt="💋" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f48b.svg"/> <img class="emoji" alt="💧" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4a7.svg"/> <img class="emoji" alt="👂" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f442.svg"/> <img class="emoji" alt="👀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f440.svg"/> <img class="emoji" alt="👃" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f443.svg"/> <img class="emoji" alt="👅" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f445.svg"/> <img class="emoji" alt="💌" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f48c.svg"/> <img class="emoji" alt="👤" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f464.svg"/> <img class="emoji" alt="👥" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f465.svg"/> <img class="emoji" alt="💬" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4ac.svg"/> <img class="emoji" alt="💭" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f4ad.svg"/>'
      )
    })

    it('Test emoji parser translating emojis unicodes to shortcodes', () => {
      // (1) Test with a single unicode emoji
      let text: string = '👍'
      let result: string = uEmojiParser.parseToShortcode(text)
      expect(result).to.be.equal(':thumbs_up:')

      // (2) Test with a multiple unicodes emojis
      text =
        '😄 😆 😊 😃 ☺️ 😏 😍 😘 😚 😳 😌 😆 😁 😉 😜 😝 😀 😗 😙 😛 😴 😟 😦 😧 😮 😬 😕 😯 😑 😒 😅 😓 😥 😩 😔 😞 😖 😨 😰 😣 😢 😭 😂 😲 😱 😫 😠 😡 😤 😪 😋 😷 😎 😵 👿 😈 😐 😶 😇 👽 💛 💙 💜 ❤️ 💚 💔 💓 💗 💕 💞 💘 💖 ✨ ⭐️ 🌟 💫 💥 💥 💢 ❗️ ❓ ❕ ❔ 💤 💨 💦 🎶 🎵 🔥 💩 💩 💩 👍 👍 👎 👎 👌 👊 👊 ✊ ✌️ 👋 ✋ ✋ 👐 ☝️ 👇 👈 👉 🙌 🙏 👆 👏 💪 🤘 🖕 🚶 🏃 🏃 👫 👪 👬 👭 💃 👯 🙆 🙅 💁 🙋 👰 🙎 🙍 🙇 💑 💆 💇 💅 👦 👧 👩 👨 👶 👵 👴 👱 👲 👳 👷 👮 👼 👸 😺 😸 😻 😽 😼 🙀 😿 😹 😾 👹 👺 🙈 🙉 🙊 💂 💀 🐾 👄 💋 💧 👂 👀 👃 👅 💌 👤 👥 💬 💭'
      result = uEmojiParser.parseToShortcode(text)
      expect(result).to.be.equal(
        ':grinning_face_with_smiling_eyes: :grinning_squinting_face: :smiling_face_with_smiling_eyes: :grinning_face_with_big_eyes: :smiling_face: :smirking_face: :smiling_face_with_heart_eyes: :face_blowing_a_kiss: :kissing_face_with_closed_eyes: :flushed_face: :relieved_face: :grinning_squinting_face: :beaming_face_with_smiling_eyes: :winking_face: :winking_face_with_tongue: :squinting_face_with_tongue: :grinning_face: :kissing_face: :kissing_face_with_smiling_eyes: :face_with_tongue: :sleeping_face: :worried_face: :frowning_face_with_open_mouth: :anguished_face: :face_with_open_mouth: :grimacing_face: :confused_face: :hushed_face: :expressionless_face: :unamused_face: :grinning_face_with_sweat: :downcast_face_with_sweat: :sad_but_relieved_face: :weary_face: :pensive_face: :disappointed_face: :confounded_face: :fearful_face: :anxious_face_with_sweat: :persevering_face: :crying_face: :loudly_crying_face: :face_with_tears_of_joy: :astonished_face: :face_screaming_in_fear: :tired_face: :angry_face: :enraged_face: :face_with_steam_from_nose: :sleepy_face: :face_savoring_food: :face_with_medical_mask: :smiling_face_with_sunglasses: :face_with_crossed_out_eyes: :angry_face_with_horns: :smiling_face_with_horns: :neutral_face: :face_without_mouth: :smiling_face_with_halo: :alien: :yellow_heart: :blue_heart: :purple_heart: :red_heart: :green_heart: :broken_heart: :beating_heart: :growing_heart: :two_hearts: :revolving_hearts: :heart_with_arrow: :sparkling_heart: :sparkles: :star:️ :glowing_star: :dizzy: :collision: :collision: :anger_symbol: :red_exclamation_mark:️ :red_question_mark: :white_exclamation_mark: :white_question_mark: :zzz: :dashing_away: :sweat_droplets: :musical_notes: :musical_note: :fire: :pile_of_poo: :pile_of_poo: :pile_of_poo: :thumbs_up: :thumbs_up: :thumbs_down: :thumbs_down: :ok_hand: :oncoming_fist: :oncoming_fist: :raised_fist: :victory_hand: :waving_hand: :raised_hand: :raised_hand: :open_hands: :index_pointing_up: :backhand_index_pointing_down: :backhand_index_pointing_left: :backhand_index_pointing_right: :raising_hands: :folded_hands: :backhand_index_pointing_up: :clapping_hands: :flexed_biceps: :sign_of_the_horns: :middle_finger: :person_walking: :person_running: :person_running: :woman_and_man_holding_hands: :family: :men_holding_hands: :women_holding_hands: :woman_dancing: :people_with_bunny_ears: :person_gesturing_ok: :person_gesturing_no: :person_tipping_hand: :person_raising_hand: :person_with_veil: :person_pouting: :person_frowning: :person_bowing: :couple_with_heart: :person_getting_massage: :person_getting_haircut: :nail_polish: :boy: :girl: :woman: :man: :baby: :old_woman: :old_man: :person_blond_hair: :person_with_skullcap: :person_wearing_turban: :construction_worker: :police_officer: :baby_angel: :princess: :grinning_cat: :grinning_cat_with_smiling_eyes: :smiling_cat_with_heart_eyes: :kissing_cat: :cat_with_wry_smile: :weary_cat: :crying_cat: :cat_with_tears_of_joy: :pouting_cat: :ogre: :goblin: :see_no_evil_monkey: :hear_no_evil_monkey: :speak_no_evil_monkey: :guard: :skull: :paw_prints: :mouth: :kiss_mark: :droplet: :ear: :eyes: :nose: :tongue: :love_letter: :bust_in_silhouette: :busts_in_silhouette: :speech_balloon: :thought_balloon:'
      )

      // (3) Test with a multiple unicodes emojis
      text = '😎'
      result = uEmojiParser.parseToShortcode(text)
      expect(result).to.be.equal(':smiling_face_with_sunglasses:')
    })

    it('Test emoji parser translating emojis shortcodes to unicodes', () => {
      // (1) Test with a single shortcode emoji
      let text: string = ':thumbsup:'
      let result: string = uEmojiParser.parseToUnicode(text)
      expect(result).to.be.equal('👍')

      // (2) Test with a single shortcode emoji
      text = ':thumbs_up:'
      result = uEmojiParser.parseToUnicode(text)
      expect(result).to.be.equal('👍')

      // (3) Test with a multiple shortcodes emojis
      text =
        ':grinning_face_with_smiling_eyes: :grinning_squinting_face: :smiling_face_with_smiling_eyes: :grinning_face_with_big_eyes: :smiling_face: :smirking_face: :smiling_face_with_heart_eyes: :face_blowing_a_kiss: :kissing_face_with_closed_eyes: :flushed_face: :relieved_face: :grinning_squinting_face: :beaming_face_with_smiling_eyes: :winking_face: :winking_face_with_tongue: :squinting_face_with_tongue: :grinning_face: :kissing_face: :kissing_face_with_smiling_eyes: :face_with_tongue: :sleeping_face: :worried_face: :frowning_face_with_open_mouth: :anguished_face: :face_with_open_mouth: :grimacing_face: :confused_face: :hushed_face: :expressionless_face: :unamused_face: :grinning_face_with_sweat: :downcast_face_with_sweat: :sad_but_relieved_face: :weary_face: :pensive_face: :disappointed_face: :confounded_face: :fearful_face: :anxious_face_with_sweat: :persevering_face: :crying_face: :loudly_crying_face: :face_with_tears_of_joy: :astonished_face: :face_screaming_in_fear: :tired_face: :angry_face: :pouting_face: :face_with_steam_from_nose: :sleepy_face: :face_savoring_food: :face_with_medical_mask: :smiling_face_with_sunglasses: :face_with_crossed_out_eyes: :angry_face_with_horns: :smiling_face_with_horns: :neutral_face: :face_without_mouth: :smiling_face_with_halo: :alien: :yellow_heart: :blue_heart: :purple_heart: :red_heart: :green_heart: :broken_heart: :beating_heart: :growing_heart: :two_hearts: :revolving_hearts: :heart_with_arrow: :sparkling_heart: :sparkles: :star:️ :glowing_star: :dizzy: :collision: :collision: :anger_symbol: :red_exclamation_mark:️ :red_question_mark: :white_exclamation_mark: :white_question_mark: :zzz: :dashing_away: :sweat_droplets: :musical_notes: :musical_note: :fire: :pile_of_poo: :pile_of_poo: :pile_of_poo: :thumbs_up: :thumbs_up: :thumbs_down: :thumbs_down: :ok_hand: :oncoming_fist: :oncoming_fist: :raised_fist: :victory_hand: :waving_hand: :raised_hand: :raised_hand: :open_hands: :index_pointing_up: :backhand_index_pointing_down: :backhand_index_pointing_left: :backhand_index_pointing_right: :raising_hands: :folded_hands: :backhand_index_pointing_up: :clapping_hands: :flexed_biceps: :sign_of_the_horns: :middle_finger: :person_walking: :person_running: :person_running: :woman_and_man_holding_hands: :family: :men_holding_hands: :women_holding_hands: :woman_dancing: :people_with_bunny_ears: :person_gesturing_ok: :person_gesturing_no: :person_tipping_hand: :person_raising_hand: :person_with_veil: :person_pouting: :person_frowning: :person_bowing: :couple_with_heart: :person_getting_massage: :person_getting_haircut: :nail_polish: :boy: :girl: :woman: :man: :baby: :old_woman: :old_man: :person_blond_hair: :person_with_skullcap: :person_wearing_turban: :construction_worker: :police_officer: :baby_angel: :princess: :grinning_cat: :grinning_cat_with_smiling_eyes: :smiling_cat_with_heart_eyes: :kissing_cat: :cat_with_wry_smile: :weary_cat: :crying_cat: :cat_with_tears_of_joy: :pouting_cat: :ogre: :goblin: :see_no_evil_monkey: :hear_no_evil_monkey: :speak_no_evil_monkey: :guard: :skull: :paw_prints: :mouth: :kiss_mark: :droplet: :ear: :eyes: :nose: :tongue: :love_letter: :bust_in_silhouette: :busts_in_silhouette: :speech_balloon: :thought_balloon:'
      result = uEmojiParser.parseToUnicode(text)
      expect(result).to.be.equal(
        '😄 😆 😊 😃 ☺️ 😏 😍 😘 😚 😳 😌 😆 😁 😉 😜 😝 😀 😗 😙 😛 😴 😟 😦 😧 😮 😬 😕 😯 😑 😒 😅 😓 😥 😩 😔 😞 😖 😨 😰 😣 😢 😭 😂 😲 😱 😫 😠 😡 😤 😪 😋 😷 😎 😵 👿 😈 😐 😶 😇 👽 💛 💙 💜 ❤️ 💚 💔 💓 💗 💕 💞 💘 💖 ✨ ⭐️ 🌟 💫 💥 💥 💢 ❗️ ❓ ❕ ❔ 💤 💨 💦 🎶 🎵 🔥 💩 💩 💩 👍 👍 👎 👎 👌 👊 👊 ✊ ✌️ 👋 ✋ ✋ 👐 ☝️ 👇 👈 👉 🙌 🙏 👆 👏 💪 🤘 🖕 🚶 🏃 🏃 👫 👪 👬 👭 💃 👯 🙆 🙅 💁 🙋 👰 🙎 🙍 🙇 💑 💆 💇 💅 👦 👧 👩 👨 👶 👵 👴 👱 👲 👳 👷 👮 👼 👸 😺 😸 😻 😽 😼 🙀 😿 😹 😾 👹 👺 🙈 🙉 🙊 💂 💀 🐾 👄 💋 💧 👂 👀 👃 👅 💌 👤 👥 💬 💭'
      )

      // (4) Test with a multiple shortcodes emojis
      text = ':smiling_face_with_sunglasses:'
      result = uEmojiParser.parseToUnicode(text)
      expect(result).to.be.equal('😎')
    })

    it('should throw error with not string parameter', () => {
      let text: any = undefined // eslint-disable-line
      expect(() => {
        uEmojiParser.parse(text)
      }).to.throw(Error)

      text = 13

      expect(() => {
        uEmojiParser.parse(text)
      }).to.throw(Error)
    })
  })

  describe('Using object options', () => {
    it('should parse emojis from unicode', () => {
      // (1) Parse to html using options
      let text: string = '😀'
      let result: string = uEmojiParser.parse(text, {})
      expect(result).to.be.equal(
        '<img class="emoji" alt="😀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f600.svg"/>'
      )

      // (2) Parse to html using options
      text = '😄'
      result = uEmojiParser.parse(text, { parseToHtml: true })
      expect(result).to.be.equal(
        '<img class="emoji" alt="😄" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f604.svg"/>'
      )

      // (3) Parse to html using options
      text = '😄'
      result = uEmojiParser.parse(text, {
        parseToHtml: true,
        parseToUnicode: false,
        parseToShortcode: false,
      })
      expect(result).to.be.equal(
        '<img class="emoji" alt="😄" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f604.svg"/>'
      )

      // (4) Parse to html using options
      text = '😄'
      result = uEmojiParser.parse(text, {
        parseToHtml: true,
        parseToUnicode: false,
        parseToShortcode: true,
      })
      expect(result).to.be.equal(
        '<img class="emoji" alt="😄" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f604.svg"/>'
      )

      // (5) Parse to html using options
      text = '😄'
      result = uEmojiParser.parse(text, {
        parseToHtml: true,
        parseToUnicode: true,
        parseToShortcode: true,
      })
      expect(result).to.be.equal(
        '<img class="emoji" alt="😄" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f604.svg"/>'
      )
    })

    it('Test emoji parser translating emojis unicodes to shortcodes', () => {
      // (1) Test with a single unicode emoji
      let text: string = '👍'
      let result: string = uEmojiParser.parse(text, {
        parseToHtml: false,
        parseToUnicode: false,
        parseToShortcode: true,
      })
      expect(result).to.be.equal(':thumbs_up:')

      // (2) Test with a multiple unicodes emojis
      text =
        '😄 😆 😊 😃 ☺️ 😏 😍 😘 😚 😳 😌 😆 😁 😉 😜 😝 😀 😗 😙 😛 😴 😟 😦 😧 😮 😬 😕 😯 😑 😒 😅 😓 😥 😩 😔 😞 😖 😨 😰 😣 😢 😭 😂 😲 😱 😫 😠 😡 😤 😪 😋 😷 😎 😵 👿 😈 😐 😶 😇 👽 💛 💙 💜 ❤️ 💚 💔 💓 💗 💕 💞 💘 💖 ✨ ⭐️ 🌟 💫 💥 💥 💢 ❗️ ❓ ❕ ❔ 💤 💨 💦 🎶 🎵 🔥 💩 💩 💩 👍 👍 👎 👎 👌 👊 👊 ✊ ✌️ 👋 ✋ ✋ 👐 ☝️ 👇 👈 👉 🙌 🙏 👆 👏 💪 🤘 🖕 🚶 🏃 🏃 👫 👪 👬 👭 💃 👯 🙆 🙅 💁 🙋 👰 🙎 🙍 🙇 💑 💆 💇 💅 👦 👧 👩 👨 👶 👵 👴 👱 👲 👳 👷 👮 👼 👸 😺 😸 😻 😽 😼 🙀 😿 😹 😾 👹 👺 🙈 🙉 🙊 💂 💀 🐾 👄 💋 💧 👂 👀 👃 👅 💌 👤 👥 💬 💭'
      result = uEmojiParser.parse(text, {
        parseToHtml: false,
        parseToUnicode: false,
        parseToShortcode: true,
      })
      expect(result).to.be.equal(
        ':grinning_face_with_smiling_eyes: :grinning_squinting_face: :smiling_face_with_smiling_eyes: :grinning_face_with_big_eyes: :smiling_face: :smirking_face: :smiling_face_with_heart_eyes: :face_blowing_a_kiss: :kissing_face_with_closed_eyes: :flushed_face: :relieved_face: :grinning_squinting_face: :beaming_face_with_smiling_eyes: :winking_face: :winking_face_with_tongue: :squinting_face_with_tongue: :grinning_face: :kissing_face: :kissing_face_with_smiling_eyes: :face_with_tongue: :sleeping_face: :worried_face: :frowning_face_with_open_mouth: :anguished_face: :face_with_open_mouth: :grimacing_face: :confused_face: :hushed_face: :expressionless_face: :unamused_face: :grinning_face_with_sweat: :downcast_face_with_sweat: :sad_but_relieved_face: :weary_face: :pensive_face: :disappointed_face: :confounded_face: :fearful_face: :anxious_face_with_sweat: :persevering_face: :crying_face: :loudly_crying_face: :face_with_tears_of_joy: :astonished_face: :face_screaming_in_fear: :tired_face: :angry_face: :enraged_face: :face_with_steam_from_nose: :sleepy_face: :face_savoring_food: :face_with_medical_mask: :smiling_face_with_sunglasses: :face_with_crossed_out_eyes: :angry_face_with_horns: :smiling_face_with_horns: :neutral_face: :face_without_mouth: :smiling_face_with_halo: :alien: :yellow_heart: :blue_heart: :purple_heart: :red_heart: :green_heart: :broken_heart: :beating_heart: :growing_heart: :two_hearts: :revolving_hearts: :heart_with_arrow: :sparkling_heart: :sparkles: :star:️ :glowing_star: :dizzy: :collision: :collision: :anger_symbol: :red_exclamation_mark:️ :red_question_mark: :white_exclamation_mark: :white_question_mark: :zzz: :dashing_away: :sweat_droplets: :musical_notes: :musical_note: :fire: :pile_of_poo: :pile_of_poo: :pile_of_poo: :thumbs_up: :thumbs_up: :thumbs_down: :thumbs_down: :ok_hand: :oncoming_fist: :oncoming_fist: :raised_fist: :victory_hand: :waving_hand: :raised_hand: :raised_hand: :open_hands: :index_pointing_up: :backhand_index_pointing_down: :backhand_index_pointing_left: :backhand_index_pointing_right: :raising_hands: :folded_hands: :backhand_index_pointing_up: :clapping_hands: :flexed_biceps: :sign_of_the_horns: :middle_finger: :person_walking: :person_running: :person_running: :woman_and_man_holding_hands: :family: :men_holding_hands: :women_holding_hands: :woman_dancing: :people_with_bunny_ears: :person_gesturing_ok: :person_gesturing_no: :person_tipping_hand: :person_raising_hand: :person_with_veil: :person_pouting: :person_frowning: :person_bowing: :couple_with_heart: :person_getting_massage: :person_getting_haircut: :nail_polish: :boy: :girl: :woman: :man: :baby: :old_woman: :old_man: :person_blond_hair: :person_with_skullcap: :person_wearing_turban: :construction_worker: :police_officer: :baby_angel: :princess: :grinning_cat: :grinning_cat_with_smiling_eyes: :smiling_cat_with_heart_eyes: :kissing_cat: :cat_with_wry_smile: :weary_cat: :crying_cat: :cat_with_tears_of_joy: :pouting_cat: :ogre: :goblin: :see_no_evil_monkey: :hear_no_evil_monkey: :speak_no_evil_monkey: :guard: :skull: :paw_prints: :mouth: :kiss_mark: :droplet: :ear: :eyes: :nose: :tongue: :love_letter: :bust_in_silhouette: :busts_in_silhouette: :speech_balloon: :thought_balloon:'
      )

      // (3) Test without unicode emojis
      text = ':thumbs_up:'
      result = uEmojiParser.parse(text, {
        parseToHtml: false,
        parseToUnicode: false,
        parseToShortcode: true,
      })
      expect(result).to.be.equal(':thumbs_up:')
    })

    it('Test emoji parser translating emojis shortcodes to unicodes', () => {
      // (1) Test with a single shortcode emoji
      let text: string = ':thumbsup:'
      let result: string = uEmojiParser.parse(text, {
        parseToHtml: false,
        parseToUnicode: true,
        parseToShortcode: false,
      })
      expect(result).to.be.equal('👍')

      // (2) Test with a single shortcode emoji
      text = ':thumbs_up:'
      result = uEmojiParser.parse(text, {
        parseToHtml: false,
        parseToUnicode: true,
        parseToShortcode: false,
      })
      expect(result).to.be.equal('👍')

      // (3) Test with a single shortcode emoji
      text = ':thumbs_up:'
      result = uEmojiParser.parse(text, {
        parseToHtml: false,
        parseToUnicode: true,
        parseToShortcode: true,
      })
      expect(result).to.be.equal('👍')

      // (4) Test with a multiple shortcodes emojis
      text =
        ':grinning_face_with_smiling_eyes: :grinning_squinting_face: :smiling_face_with_smiling_eyes: :grinning_face_with_big_eyes: :smiling_face: :smirking_face: :smiling_face_with_heart_eyes: :face_blowing_a_kiss: :kissing_face_with_closed_eyes: :flushed_face: :relieved_face: :grinning_squinting_face: :beaming_face_with_smiling_eyes: :winking_face: :winking_face_with_tongue: :squinting_face_with_tongue: :grinning_face: :kissing_face: :kissing_face_with_smiling_eyes: :face_with_tongue: :sleeping_face: :worried_face: :frowning_face_with_open_mouth: :anguished_face: :face_with_open_mouth: :grimacing_face: :confused_face: :hushed_face: :expressionless_face: :unamused_face: :grinning_face_with_sweat: :downcast_face_with_sweat: :sad_but_relieved_face: :weary_face: :pensive_face: :disappointed_face: :confounded_face: :fearful_face: :anxious_face_with_sweat: :persevering_face: :crying_face: :loudly_crying_face: :face_with_tears_of_joy: :astonished_face: :face_screaming_in_fear: :tired_face: :angry_face: :pouting_face: :face_with_steam_from_nose: :sleepy_face: :face_savoring_food: :face_with_medical_mask: :smiling_face_with_sunglasses: :face_with_crossed_out_eyes: :angry_face_with_horns: :smiling_face_with_horns: :neutral_face: :face_without_mouth: :smiling_face_with_halo: :alien: :yellow_heart: :blue_heart: :purple_heart: :red_heart: :green_heart: :broken_heart: :beating_heart: :growing_heart: :two_hearts: :revolving_hearts: :heart_with_arrow: :sparkling_heart: :sparkles: :star:️ :glowing_star: :dizzy: :collision: :collision: :anger_symbol: :red_exclamation_mark:️ :red_question_mark: :white_exclamation_mark: :white_question_mark: :zzz: :dashing_away: :sweat_droplets: :musical_notes: :musical_note: :fire: :pile_of_poo: :pile_of_poo: :pile_of_poo: :thumbs_up: :thumbs_up: :thumbs_down: :thumbs_down: :ok_hand: :oncoming_fist: :oncoming_fist: :raised_fist: :victory_hand: :waving_hand: :raised_hand: :raised_hand: :open_hands: :index_pointing_up: :backhand_index_pointing_down: :backhand_index_pointing_left: :backhand_index_pointing_right: :raising_hands: :folded_hands: :backhand_index_pointing_up: :clapping_hands: :flexed_biceps: :sign_of_the_horns: :middle_finger: :person_walking: :person_running: :person_running: :woman_and_man_holding_hands: :family: :men_holding_hands: :women_holding_hands: :woman_dancing: :people_with_bunny_ears: :person_gesturing_ok: :person_gesturing_no: :person_tipping_hand: :person_raising_hand: :person_with_veil: :person_pouting: :person_frowning: :person_bowing: :couple_with_heart: :person_getting_massage: :person_getting_haircut: :nail_polish: :boy: :girl: :woman: :man: :baby: :old_woman: :old_man: :person_blond_hair: :person_with_skullcap: :person_wearing_turban: :construction_worker: :police_officer: :baby_angel: :princess: :grinning_cat: :grinning_cat_with_smiling_eyes: :smiling_cat_with_heart_eyes: :kissing_cat: :cat_with_wry_smile: :weary_cat: :crying_cat: :cat_with_tears_of_joy: :pouting_cat: :ogre: :goblin: :see_no_evil_monkey: :hear_no_evil_monkey: :speak_no_evil_monkey: :guard: :skull: :paw_prints: :mouth: :kiss_mark: :droplet: :ear: :eyes: :nose: :tongue: :love_letter: :bust_in_silhouette: :busts_in_silhouette: :speech_balloon: :thought_balloon:'
      result = uEmojiParser.parseToUnicode(text)
      expect(result).to.be.equal(
        '😄 😆 😊 😃 ☺️ 😏 😍 😘 😚 😳 😌 😆 😁 😉 😜 😝 😀 😗 😙 😛 😴 😟 😦 😧 😮 😬 😕 😯 😑 😒 😅 😓 😥 😩 😔 😞 😖 😨 😰 😣 😢 😭 😂 😲 😱 😫 😠 😡 😤 😪 😋 😷 😎 😵 👿 😈 😐 😶 😇 👽 💛 💙 💜 ❤️ 💚 💔 💓 💗 💕 💞 💘 💖 ✨ ⭐️ 🌟 💫 💥 💥 💢 ❗️ ❓ ❕ ❔ 💤 💨 💦 🎶 🎵 🔥 💩 💩 💩 👍 👍 👎 👎 👌 👊 👊 ✊ ✌️ 👋 ✋ ✋ 👐 ☝️ 👇 👈 👉 🙌 🙏 👆 👏 💪 🤘 🖕 🚶 🏃 🏃 👫 👪 👬 👭 💃 👯 🙆 🙅 💁 🙋 👰 🙎 🙍 🙇 💑 💆 💇 💅 👦 👧 👩 👨 👶 👵 👴 👱 👲 👳 👷 👮 👼 👸 😺 😸 😻 😽 😼 🙀 😿 😹 😾 👹 👺 🙈 🙉 🙊 💂 💀 🐾 👄 💋 💧 👂 👀 👃 👅 💌 👤 👥 💬 💭'
      )

      // (5) Test without shortcodes
      text = '👍'
      result = uEmojiParser.parse(text, {
        parseToHtml: false,
        parseToUnicode: true,
        parseToShortcode: false,
      })
      expect(result).to.be.equal('👍')
    })

    it('should throw error with not string parameter', () => {
      let text: any = undefined // eslint-disable-line
      expect(() => {
        uEmojiParser.parse(text)
      }).to.throw(Error)

      text = 13

      expect(() => {
        uEmojiParser.parse(text)
      }).to.throw(Error)
    })
  })

  describe('Coffee Tests', () => {
    it('should parse emojis about coffee', () => {
      // (1) Coffee ☕
      let text: string = '☕'
      let result: string = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="☕" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2615.svg"/>'
      )

      // (2) Coffee ☕
      text = ':coffee:'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="☕" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2615.svg"/>'
      )

      // (3) Brown Coffee 🤎
      text = '🤎'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="🤎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f90e.svg"/>'
      )

      // (4) Brown Coffee 🤎
      text = ':brown_heart:'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="🤎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f90e.svg"/>'
      )

      // (5) Multiple emojis
      text = 'Coffee emojis: ☕ 🤎 :coffee: :brown_heart:'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        'Coffee emojis: <img class="emoji" alt="☕" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2615.svg"/> <img class="emoji" alt="🤎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f90e.svg"/> <img class="emoji" alt="☕" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2615.svg"/> <img class="emoji" alt="🤎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f90e.svg"/>'
      )

      // (6) Multiple emojis, parse to unicode
      text = 'Coffee emojis: ☕ 🤎 :coffee: :brown_heart:'
      result = uEmojiParser.parse(text, {
        parseToHtml: false,
        parseToUnicode: true,
      })
      expect(result).to.be.equal('Coffee emojis: ☕ 🤎 ☕ 🤎')
    })
  })

  describe('Heart Tests', () => {
    it('should parse emojis about heart', () => {
      // (1) Heart ❤️
      let text: string = '❤️'
      let result: string = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="❤️" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2764.svg"/>'
      )

      // (2) Heart ❤️
      text = ':heart:'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="❤️" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2764.svg"/>'
      )

      // (3) Heart with Arrow 💘
      text = '💘'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="💘" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f498.svg"/>'
      )

      // (4) Heart with Arrow 💘
      text = ':heart_with_arrow:'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="💘" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f498.svg"/>'
      )

      // (5) Multiple emojis
      text = 'Heart emojis: ❤️ 💘 :heart: :heart_with_arrow:'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        'Heart emojis: <img class="emoji" alt="❤️" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2764.svg"/> <img class="emoji" alt="💘" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f498.svg"/> <img class="emoji" alt="❤️" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/2764.svg"/> <img class="emoji" alt="💘" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f498.svg"/>'
      )

      // (6) Multiple emojis, parse to unicode
      text = 'Heart emojis: ❤️ 💘 :heart: :heart_with_arrow:'
      result = uEmojiParser.parse(text, {
        parseToHtml: false,
        parseToUnicode: true,
      })
      expect(result).to.be.equal('Heart emojis: ❤️ 💘 ❤️ 💘')
    })
  })

  describe('Readme tests', () => {
    it('should parse tests with default options', () => {
      // (1) Test with default options
      let text: string = '😎'
      let result: string = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/>'
      )

      // (2) Test with default options
      text = ':smiling_face_with_sunglasses:'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/>'
      )

      // (3) Test with default options
      text = '🚀'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/>'
      )

      // (4) Test with default options
      text = ':rocket:'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        '<img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/>'
      )

      // (5) Test with default options
      text = 'Hello world! 😎 :smiling_face_with_sunglasses: 🚀 :rocket:'
      result = uEmojiParser.parse(text)
      expect(result).to.be.equal(
        'Hello world! <img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/> <img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/> <img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/> <img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/>'
      )
    })

    it('should parse tests using method options', () => {
      // (1) Test with method options
      let text: string = '😎'
      let result: string = uEmojiParser.parse(text, {})
      expect(result).to.be.equal(
        '<img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/>'
      )

      // (3) Test with method options
      text = ':smiling_face_with_sunglasses:'
      result = uEmojiParser.parse(text, { parseToHtml: true })
      expect(result).to.be.equal(
        '<img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/>'
      )

      // (2) Test with method options
      text = 'Hello world! 😎 :smiling_face_with_sunglasses: 🚀 :rocket:'
      result = uEmojiParser.parseToHtml(text)
      expect(result).to.be.equal(
        'Hello world! <img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/> <img class="emoji" alt="😎" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/> <img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/> <img class="emoji" alt="🚀" src="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/>'
      )

      // (5) Test with method options
      text = 'Hello world! :smiling_face_with_sunglasses: :rocket:'
      result = uEmojiParser.parse(text, {
        parseToHtml: false,
        parseToUnicode: true,
      })
      expect(result).to.be.equal('Hello world! 😎 🚀')

      // (6) Test with method options
      text = 'Hello world! :smiling_face_with_sunglasses: :rocket:'
      result = uEmojiParser.parseToUnicode(text)
      expect(result).to.be.equal('Hello world! 😎 🚀')

      // (7) Test with method options
      text = 'Hello world! 😎 🚀'
      result = uEmojiParser.parse(text, {
        parseToHtml: false,
        parseToShortcode: true,
      })
      expect(result).to.be.equal('Hello world! :smiling_face_with_sunglasses: :rocket:')

      // (8) Test with method options
      text = 'Hello world! 😎 🚀'
      result = uEmojiParser.parseToShortcode(text)
      expect(result).to.be.equal('Hello world! :smiling_face_with_sunglasses: :rocket:')

      // (8) Test with method options using custom CDN
      text = 'Hello world! 😎 🚀'
      result = uEmojiParser.parse(text, {
        parseToHtml: false,
        emojiCDN: 'https://custom.emoji.cdn/gh/jdecked/twemoji@latest/assets/svg/',
      })
      expect(result).to.be.equal('Hello world! 😎 🚀')

      // (9) Test with method options using custom CDN
      text = 'Hello world! 😎 🚀'
      result = uEmojiParser.parse(text, {
        parseToHtml: true,
        emojiCDN: 'https://custom.emoji.cdn/gh/jdecked/twemoji@latest/assets/svg/',
      })
      expect(result).to.be.equal(
        'Hello world! <img class="emoji" alt="😎" src="https://custom.emoji.cdn/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/> <img class="emoji" alt="🚀" src="https://custom.emoji.cdn/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/>'
      )

      // (10) Test with method options using custom CDN
      text = 'Hello world! 😎 🚀'
      result = uEmojiParser.parse(text, {
        emojiCDN: 'https://custom.emoji.cdn/gh/jdecked/twemoji@latest/assets/svg/',
      })
      expect(result).to.be.equal(
        'Hello world! <img class="emoji" alt="😎" src="https://custom.emoji.cdn/gh/jdecked/twemoji@latest/assets/svg/1f60e.svg"/> <img class="emoji" alt="🚀" src="https://custom.emoji.cdn/gh/jdecked/twemoji@latest/assets/svg/1f680.svg"/>'
      )
    })
  })
})
