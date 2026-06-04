const { gmd, getExtensionFromMime, isTextContent } = require("../gift");
const axios = require("axios");
const fs = require("fs").promises;
const { sendButtons } = require("gifted-btns");
const path = require("path");

gmd(
  {
    pattern: "ssphone",
    aliases: ["ssmobile", "phoness"],
    react: "📱",
    category: "tools",
    description: "Take a screenshot of a website (mobile view)",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      q,
      botFooter,
      botName,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    const url = q?.trim();
    if (!url) {
      await react("❌");
      return reply(
        "Please provide a URL\n\nUsage: .ssphone https://google.com",
      );
    }

    await react("⏳");

    try {
      const res = await axios.get(`${GiftedTechApi}/api/tools/ssphone`, {
        params: { apikey: GiftedApiKey, url: url },
        responseType: "arraybuffer",
      });

      await Gifted.sendMessage(
        from,
        {
          image: Buffer.from(res.data),
          caption: `*${botName} SCREENSHOT*\n\n🌐 ${url}\n📱 Mobile View\n\n> *${botFooter}*`,
        },
        { quoted: mek },
      );

      await react("✅");
    } catch (e) {
      console.error("Screenshot error:", e);
      await react("❌");
      return reply("Failed to capture screenshot: " + e.message);
    }
  },
);

gmd(
  {
    pattern: "sstab",
    aliases: ["sstablet", "tabletss"],
    react: "📱",
    category: "tools",
    description: "Take a screenshot of a website (tablet view)",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      q,
      botFooter,
      botName,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    const url = q?.trim();
    if (!url) {
      await react("❌");
      return reply("Please provide a URL\n\nUsage: .sstab https://google.com");
    }

    await react("⏳");

    try {
      const res = await axios.get(`${GiftedTechApi}/api/tools/sstab`, {
        params: { apikey: GiftedApiKey, url: url },
        responseType: "arraybuffer",
      });

      await Gifted.sendMessage(
        from,
        {
          image: Buffer.from(res.data),
          caption: `*${botName} SCREENSHOT*\n\n🌐 ${url}\n📱 Tablet View\n\n> *${botFooter}*`,
        },
        { quoted: mek },
      );

      await react("✅");
    } catch (e) {
      console.error("Screenshot error:", e);
      await react("❌");
      return reply("Failed to capture screenshot: " + e.message);
    }
  },
);

gmd(
  {
    pattern: "sspc",
    aliases: ["pcss", "desktopss"],
    react: "🖥️",
    category: "tools",
    description: "Take a screenshot of a website (PC view)",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      q,
      botFooter,
      botName,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    const url = q?.trim();
    if (!url) {
      await react("❌");
      return reply("Please provide a URL\n\nUsage: .sspc https://google.com");
    }

    await react("⏳");

    try {
      const res = await axios.get(`${GiftedTechApi}/api/tools/sspc`, {
        params: { apikey: GiftedApiKey, url: url },
        responseType: "arraybuffer",
      });

      await Gifted.sendMessage(
        from,
        {
          image: Buffer.from(res.data),
          caption: `*${botName} SCREENSHOT*\n\n🌐 ${url}\n🖥️ Desktop View\n\n> *${botFooter}*`,
        },
        { quoted: mek },
      );

      await react("✅");
    } catch (e) {
      console.error("Screenshot error:", e);
      await react("❌");
      return reply("Failed to capture screenshot: " + e.message);
    }
  },
);

const emojis = ['💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '❤️‍', '🔥', '❤️‍', '🩹', '💯', '♨️', '💢', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🌐', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄️', '🎴', '🎭️', '🔇', '🔈️', '🔉', '🔊', '🔔', '🔕', '🎼', '🎵', '🎶', '💹', '🏧', '🚮', '🚰', '♿️', '🚹️', '🚺️', '🚻', '🚼️', '🚾', '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔️', '🚫', '🚳', '🚭️', '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '🛐', '⚛️', '🕉️', '✡️', '☸️', '☯️', '✝️', '☦️', '☪️', '☮️', '🕎', '🔯', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '⛎', '🔀', '🔁', '🔂', '▶️', '⏩️', '⏭️', '⏯️', '◀️', '⏪️', '⏮️', '🔼', '⏫', '🔽', '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '🔅', '🔆', '📶', '📳', '📴', '♀️', '♂️', '⚧', '✖️', '➕', '➖', '➗', '♾️', '‼️', '⁉️', '❓️', '❔', '❕', '❗️', '〰️', '💱', '💲', '⚕️', '♻️', '⚜️', '🔱', '📛', '🔰', '⭕️', '✅', '☑️', '✔️', '❌', '❎', '➰', '➿', '〽️', '✳️', '✴️', '❇️', '©️', '®️', '™️', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔠', '🔡', '🔢', '🔣', '🔤', '🅰️', '🆎', '🅱️', '🆑', '🆒', '🆓', 'ℹ️', '🆔', 'Ⓜ️', '🆕', '🆖', '🅾️', '🆗', '🅿️', '🆘', '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯️', '🉐', '🈹', '🈚️', '🈲', '🉑', '🈸', '🈴', '🈳', '㊗️', '㊙️', '🈺', '🈵', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫️', '⚪️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛️', '⬜️', '◼️', '◻️', '◾️', '◽️', '▪️', '▫️', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '🕛️', '🕧️', '🕐️', '🕜️', '🕑️', '🕝️', '🕒️', '🕞️', '🕓️', '🕟️', '🕔️', '🕠️', '🕕️', '🕡️', '🕖️', '🕢️', '🕗️', '🕣️', '🕘️', '🕤️', '🕙️', '🕥️', '🕚️', '🕦️', '*️', '#️', '0️', '1️', '2️', '3️', '4️', '5️', '6️', '7️', '8️', '9️', '🛎️', '🧳', '⌛️', '⏳️', '⌚️', '⏰', '⏱️', '⏲️', '🕰️', '🌡️', '🗺️', '🧭', '🎃', '🎄', '🧨', '🎈', '🎉', '🎊', '🎎', '🎏', '🎐', '🎀', '🎁', '🎗️', '🎟️', '🎫', '🔮', '🧿', '🎮️', '🕹️', '🎰', '🎲', '♟️', '🧩', '🧸', '🖼️', '🎨', '🧵', '🧶', '👓️', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🛍️', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓️', '🧢', '⛑️', '📿', '💄', '💍', '💎', '📢', '📣', '📯', '🎙️', '🎚️', '🎛️', '🎤', '🎧️', '📻️', '🎷', '🎸', '🎹', '🎺', '🎻', '🪕', '🥁', '📱', '📲', '☎️', '📞', '📟️', '📠', '🔋', '🔌', '💻️', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿️', '📀', '🧮', '🎥', '🎞️', '📽️', '🎬️', '📺️', '📷️', '📸', '📹️', '📼', '🔍️', '🔎', '🕯️', '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗', '📘', '📙', '📚️', '📓', '📒', '📃', '📜', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '💰️', '💴', '💵', '💶', '💷', '💸', '💳️', '🧾', '✉️', '💌', '📧', '🧧', '📨', '📩', '📤️', '📥️', '📦️', '📫️', '📪️', '📬️', '📭️', '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋️', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒️', '🔓️', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '💣️', '🏹', '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🧰', '🧲', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛏️', '🛋️', '🪑', '🚽', '🚿', '🛁', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '🚬', '⚰️', '⚱️', '🏺', '🕳️', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠️', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭️', '🏯', '🏰', '💒', '🗼', '🗽', '⛪️', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲️', '⛺️', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '🗾', '🏞️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇️', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍️', '🚎', '🚐', '🚑️', '🚒', '🚓', '🚔️', '🚕', '🚖', '🚗', '🚘️', '🚙', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲️', '🛴', '🛹', '🚏', '🛣️', '🛤️', '🛢️', '⛽️', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓️', '⛵️', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', ' \%)$.forEach((f, i) => {
452:           txt += `*${i + 1}. ${r.name}*\n${r.result}\n\n`;
453:         });
454:         txt += `\n💡 Use ${botPrefix}fancy<number> to copy specific style\nExample: ${botPrefix}fancy5 ${text}\n\n> *${botFooter}*`;
455: 
456:         await reply(txt);
457:       }
458: 
459:       await react("✅");
460:     } catch (e) {
461:       console.error("Fancy text error:", e);
462:       await react("❌");
463:       return reply("Failed to generate fancy text: " + e.message);
464:     }
465:   },
466: );
467: 
468: gmd(
469:   {
470:     pattern: "define",
471:     aliases: ["meaning", "urban", "dictionary"],
472:     react: "📖",
473:     category: "tools",
474:     description: "Get the meaning/definition of a word",
475:   },
476:   async (from, Gifted, conText) => {
477:     const { reply, react, q, botFooter, botName, botPrefix, GiftedTechApi, GiftedApiKey } =
478:       conText;
479: 
480:     const term = q?.trim();
481:     if (!term) {
482:       await react("❌");
483:       return reply(`Please provide a word to define\n\nUsage: ${botPrefix}define hello`);
484:     }
485: 
486:     await react("⏳");
487: 
488:     try {
489:       const res = await axios.get(`${GiftedTechApi}/api/tools/define`, {
490:         params: { apikey: GiftedApiKey, term: term },
491:       });
492: 
493:       if (!res.data?.success || !res.data?.results?.length) {
494:         await react("❌");
495:         return reply("No definitions found for: " + term);
496:       }
497: 
498:       const definitions = res.data.results.slice(0, 5);
499: 
500:       let txt = `*${botName} DICTIONARY*\n\n`;
501:       txt += `📖 *Word:* ${term}\n\n`;
502: 
503:       definitions.forEach((def, i) => {
504:         const cleanDef = def.definition.replace(/\[([^\]]+)\]/g, "$1");
505:         const cleanExample = def.example?.replace(/\[([^\]]+)\]/g, "$1");
506:         txt += `*${i + 1}. ${def.word}*\n`;
507:         txt += `📝 ${cleanDef}\n`;
508:         if (cleanExample) txt += `💬 _"${cleanExample}"_\n`;
509:         txt += `👤 by ${def.author}\n\n`;
510:       });
511: 
512:       txt += `> *${botFooter}*`;
513: 
514:       await reply(txt);
515:       await react("✅");
516:     } catch (e) {
517:       console.error("Define error:", e);
518:       await react("❌");
519:       return reply("Failed to get definition: " + e.message);
520:     }
521:   },
522: );
523: 
524: gmd(
525:   {
526:     pattern: "web2zip",
527:     aliases: ["webtozip", "webdl", "dlweb", "downloadweb"],
528:     react: "📦",
529:     category: "tools",
530:     description: "Download a website as a ZIP file",
531:   },
532:   async (from, Gifted, conText) => {
533:     const {
534:       mek,
535:       reply,
536:       react,
537:       q,
538:       botFooter,
539:       botName,
540:       botPrefix,
541:       GiftedTechApi,
542:       GiftedApiKey,
543:     } = conText;
544: 
545:     const url = q?.trim();
546:     if (!url) {
547:       await react("❌");
548:       return reply(
549:         `Please provide a URL\n\nUsage: ${botPrefix}web2zip https://example.com`,
550:       );
551:     }
552: 
553:     await react("⏳");
554: 
555:     try {
556:       const res = await axios.get(`${GiftedTechApi}/api/tools/web2zip`, {
557:         params: { apikey: GiftedApiKey, url: url },
558:         responseType: "arraybuffer",
559:       });
560: 
561:       let domain;
562:       try {
563:         domain = new URL(url).hostname.replace(/[^a-z0-9]/gi, "_");
564:       } catch {
565:         domain = "website";
566:       }
567: 
568:       await Gifted.sendMessage(
569:         from,
570:         {
571:           document: Buffer.from(res.data),
572:           mimetype: "application/zip",
573:           fileName: `${domain}.zip`,
574:           caption: `*${botName} WEB2ZIP*\n\n🌐 ${url}\n\n> *${botFooter}*`,
575:         },
576:         { quoted: mek },
577:       );
578: 
579:       await react("✅");
580:     } catch (e) {
581:       console.error("Web2zip error:", e);
582:       await react("❌");
583:       return reply("Failed to download website: " + e.message);
584:     }
585:   },
586: );
587: 
588: gmd(
589:   {
590:     pattern: "emojimix",
591:     aliases: ["emomix", "mixemoji"],
592:     react: "😀",
593:     category: "tools",
594:     description: "Mix two emojis together",
595:   },
596:   async (from, Gifted, conText) => {
597:     const {
598:       mek,
599:       reply,
600:       react,
601:       q,
602:       botFooter,
603:       botName,
604:       botPrefix,
605:       GiftedTechApi,
606:       GiftedApiKey,
607:     } = conText;
608: 
609:     const input = q?.trim();
610:     if (!input) {
611:       await react("❌");
612:       return reply(
613:         `Please provide two emojis\n\nUsage: ${botPrefix}emojimix 😂:🙄\nOr: ${botPrefix}emojimix 😂🙄`,
614:       );
615:     }
616: 
617:     let emoji1, emoji2;
618: 
619:     if (input.includes(":")) {
620:       const parts = input.split(":");
621:       emoji1 = parts[0].trim();
622:       emoji2 = parts[1].trim();
623:     } else {
624:       const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
625:       const emojis = input.match(emojiRegex);
626:       if (emojis && emojis.length >= 2) {
627:         emoji1 = emojis[0];
628:         emoji2 = emojis[1];
629:       }
630:     }
631: 
632:     if (!emoji1 || !emoji2) {
633:       await react("❌");
634:       return reply(`Please provide two valid emojis\n\nUsage: ${botPrefix}emojimix 😂:🙄`);
635:     }
636: 
637:     await react("⏳");
638: 
639:     try {
640:       const res = await axios.get(`${GiftedTechApi}/api/tools/emojimix`, {
641:         params: { apikey: GiftedApiKey, emoji1: emoji1, emoji2: emoji2 },
642:         responseType: "arraybuffer",
643:       });
644: 
645:       await Gifted.sendMessage(
646:         from,
647:         {
648:           image: Buffer.from(res.data),
649:           caption: `*${botName} EMOJI MIX*\n\n${emoji1} + ${emoji2}\n\n> *${botFooter}*`,
650:         },
651:         { quoted: mek },
652:       );
653: 
654:       await react("✅");
655:     } catch (e) {
656:       console.error("Emoji mix error:", e);
657:       await react("❌");
658:       return reply(
659:         "Failed to mix emojis. Make sure both emojis are valid and supported.",
660:       );
661:     }
662:   },
663: );
664: 
665: gmd(
666:   {
667:     pattern: "rename",
668:     aliases: ["newname", "renamefile", "rn"],
669:     react: "📝",
670:     category: "tools",
671:     description: "Rename a quoted document/file with a new name",
672:   },
673:   async (from, Gifted, conText) => {
674:     const {
675:       mek,
676:       reply,
677:       react,
678:       q,
679:       quoted,
680:       quotedMsg,
681:       getMediaBuffer,
682:       getFileContentType,
683:       botPrefix,
684:     } = conText;
685: 
686:     if (!quotedMsg) {
687:       await react("❌");
688:       return reply(`Please quote/reply to a document or media file\n\nUsage: ${botPrefix}rename <new filename>`);
689:     }
690: 
700:       } else if (quotedMsg.stickerMessage) {
701:         mediaMsg = quotedMsg.stickerMessage;
702:         mediaType = "sticker";
703:         originalMime = "image/webp";
704:         originalExt = ".webp";
705:       } else {
706:         await react("❌");
707:         return reply("❌ Please quote a document, image, video, audio, or sticker file.");
708:       }
709: 
710:       const buffer = await getMediaBuffer(mediaMsg, mediaType);
711: 
712:       let finalName = newName;
713:       if (!finalName.includes(".") && originalExt) {
714:         finalName = newName + originalExt;
715:       }
716: 
717:       await Gifted.sendMessage(
718:         from,
719:         {
720:           document: buffer,
721:           fileName: finalName,
722:           mimetype: originalMime,
723:         },
724:         { quoted: mek }
725:       );
726: 
727:       await react("✅");
728:     } catch (e) {
729:       console.error("Rename error:", e);
730:       await react("❌");
731:       return reply("Failed to rename file: " + e.message);
732:     }
733:   },
734: );
735: 
736: // Local QR code generator using qrcode package
737: const QRCode = require("qrcode");
738: 
739: // Replaced the axios call in createqr to work offline / locally
740: gmd(
741:   {
742:     pattern: "createqr",
743:     aliases: ["toqr", "qrcode", "makeqr"],
744:     react: "📱",
745:     category: "tools",
746:     description: "Create a QR code from text or link",
747:   },
748:   async (from, Gifted, conText) => {
749:     const {
750:       mek,
751:       reply,
752:       react,
753:       q,
754:       quoted,
755:       quotedMsg,
756:       botFooter,
757:       botName,
758:       botPrefix,
759:     } = conText;
760: 
761:     let content = q?.trim();
762: 
763:     if (!content && quotedMsg) {
764:       content = quoted?.conversation || quoted?.extendedTextMessage?.text;
765:     }
766: 
767:     if (!content) {
768:       await react("❌");
769:       return reply(
770:         `Please provide text or a link\n\nUsage: ${botPrefix}createqr Hello World\nOr quote a message`,
771:       );
772:     }
773: 
774:     await react("⏳");
775: 
776:     try {
777:       const qrBuffer = await QRCode.toBuffer(content, {
778:         type: 'png',
779:         margin: 2,
780:         scale: 8
781:       });
782: 
783:       await Gifted.sendMessage(
784:         from,
785:         {
786:           image: qrBuffer,
787:           caption: `*${botName} QR CODE*\n\n📝 Content: ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}\n\n> *${botFooter}*`,
788:         },
789:         { quoted: mek },
790:       );
791: 
792:       await react("✅");
793:     } catch (e) {
794:       console.error("Create QR error:", e);
795:       await react("❌");
796:       return reply("Failed to create QR code: " + e.message);
797:     }
798:   },
799: );

gmd(
  {
    pattern: "readqr",
    aliases: ["decodeqr", "scanqr"],
    react: "📱",
    category: "tools",
    description: "Read/decode a QR code from an image",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      q,
      quoted,
      quotedMsg,
      botFooter,
      botName,
      botPrefix,
      GiftedTechApi,
      GiftedApiKey,
      uploadToImgBB,
    } = conText;

    let imageUrl = q?.trim();

    if (!imageUrl && quotedMsg) {
      const quotedImage = quoted?.imageMessage || quoted?.message?.imageMessage;
      if (quotedImage) {
        try {
          const tempPath = await Gifted.downloadAndSaveMediaMessage(
            quotedImage,
            "temp_qr",
          );
          const buffer = await fs.readFile(tempPath);
          const upload = await uploadToImgBB(buffer, "qr.jpg");
          imageUrl = upload.url;
          await fs.unlink(tempPath).catch(() => {});
        } catch (e) {
          await react("❌");
          return reply("Failed to process the quoted image");
        }
      }
    }

    if (!imageUrl) {
      await react("❌");
      return reply(
        `Please provide a QR code image URL or quote an image\n\nUsage: ${botPrefix}readqr <url>\nOr quote an image`,
      );
    }

    await react("⏳");

    try {
      const res = await axios.get(`${GiftedTechApi}/api/tools/readqr`, {
        params: { apikey: GiftedApiKey, url: imageUrl },
      });

      if (!res.data?.success) {
        await react("❌");
        return reply("Failed to read QR code or no QR code found in image");
      }

      const rawResult = res.data.result || res.data.data;
      const qrContent = typeof rawResult === 'object' ? (rawResult.qrcode_data || rawResult.data || JSON.stringify(rawResult)) : rawResult;

      await sendButtons(Gifted, from, {
        title: `${botName} QR READER`,
        text: `📱 *QR Code Content:*\n\n${qrContent}`,
        footer: botFooter,
        buttons: [
          {
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
              display_text: "📋 Copy Content",
              copy_code: qrContent,
            }),
          },
        ],
      });

      await react("✅");
    } catch (e) {
      console.error("Read QR error:", e);
      await react("❌");
      return reply("Failed to read QR code: " + e.message);
    }
  },
);

gmd(
  {
    pattern: "ttp",
    aliases: ["textpic", "texttoimage"],
    react: "🎨",
    category: "tools",
    description: "Convert text to picture sticker",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      q,
      botName,
      botPrefix,
      GiftedTechApi,
      GiftedApiKey,
      packName,
      packAuthor,
    } = conText;

    const text = q?.trim();
    if (!text) {
      await react("❌");
      return reply(`Please provide text\n\nUsage: ${botPrefix}ttp Hello World`);
    }

    await react("⏳");

    try {
      const res = await axios.get(`${GiftedTechApi}/api/tools/ttp`, {
        params: { apikey: GiftedApiKey, query: text },
      });

      if (!res.data?.success || !res.data?.image_url) {
        await react("❌");
        return reply("Failed to create text image");
      }

      const imgRes = await axios.get(res.data.image_url, {
        responseType: "arraybuffer",
      });

      await Gifted.sendMessage(
        from,
        {
          sticker: Buffer.from(imgRes.data),
          packname: packName || botName,
          author: packAuthor || botName,
        },
        { quoted: mek },
      );

      await react("✅");
    } catch (e) {
      console.error("TTP error:", e);
      await react("❌");
      return reply("Failed to create sticker: " + e.message);
    }
  },
);

gmd(
  {
    pattern: "fancy",
    aliases: ["fancytext", "font", "fonts", "fancy1", "fancy2", "fancy3", "fancy4", "fancy5", "fancy6", "fancy7", "fancy8", "fancy9", "fancy10", "fancy11", "fancy12", "fancy13", "fancy14", "fancy15", "fancy16", "fancy17", "fancy18", "fancy19", "fancy20"],
    react: "✨",
    category: "tools",
    description: "Convert text to fancy fonts",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      q,
      command,
      botFooter,
      botName,
      botPrefix,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    const text = q?.trim();
    if (!text) {
      await react("❌");
      return reply(
        `Please provide text\n\nUsage: ${botPrefix}fancy Hello\nOr ${botPrefix}fancy4 Hello (for specific style)`,
      );
    }

    await react("⏳");

    try {
      const res = await axios.get(`${GiftedTechApi}/api/tools/fancy`, {
        params: { apikey: GiftedApiKey, text: text },
      });

      if (!res.data?.success || !res.data?.results) {
        await react("❌");
        return reply("Failed to generate fancy text");
      }

      const results = res.data.results;

      const numMatch = command.match(/fancy(\d+)/i);
      if (numMatch) {
        const index = parseInt(numMatch[1]) - 1;
        if (index >= 0 && index < results.length) {
          const selected = results[index];
          await sendButtons(Gifted, from, {
            title: `${botName} FANCY TEXT`,
            text: `✨ *Style:* ${selected.name}\n\n${selected.result}`,
            footer: botFooter,
            buttons: [
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "📋 Copy Text",
                  copy_code: selected.result,
                }),
              },
            ],
          });
        } else {
          await react("❌");
          return reply(`Invalid style number. Available: 1-${results.length}`);
        }
      } else {
        let txt = `*${botName} FANCY TEXT*\n\n`;
        txt += `📝 *Input:* ${text}\n\n`;
        results.forEach((r, i) => {
          txt += `*${i + 1}. ${r.name}*\n${r.result}\n\n`;
        });
        txt += `\n💡 Use ${botPrefix}fancy<number> to copy specific style\nExample: ${botPrefix}fancy5 ${text}\n\n> *${botFooter}*`;

        await reply(txt);
      }

      await react("✅");
    } catch (e) {
      console.error("Fancy text error:", e);
      await react("❌");
      return reply("Failed to generate fancy text: " + e.message);
    }
  },
);

gmd(
  {
    pattern: "define",
    aliases: ["meaning", "urban", "dictionary"],
    react: "📖",
    category: "tools",
    description: "Get the meaning/definition of a word",
  },
  async (from, Gifted, conText) => {
    const { reply, react, q, botFooter, botName, botPrefix, GiftedTechApi, GiftedApiKey } =
      conText;

    const term = q?.trim();
    if (!term) {
      await react("❌");
      return reply(`Please provide a word to define\n\nUsage: ${botPrefix}define hello`);
    }

    await react("⏳");

    try {
      const res = await axios.get(`${GiftedTechApi}/api/tools/define`, {
        params: { apikey: GiftedApiKey, term: term },
      });

      if (!res.data?.success || !res.data?.results?.length) {
        await react("❌");
        return reply("No definitions found for: " + term);
      }

      const definitions = res.data.results.slice(0, 5);

      let txt = `*${botName} DICTIONARY*\n\n`;
      txt += `📖 *Word:* ${term}\n\n`;

      definitions.forEach((def, i) => {
        const cleanDef = def.definition.replace(/\[([^\]]+)\]/g, "$1");
        const cleanExample = def.example?.replace(/\[([^\]]+)\]/g, "$1");
        txt += `*${i + 1}. ${def.word}*\n`;
        txt += `📝 ${cleanDef}\n`;
        if (cleanExample) txt += `💬 _"${cleanExample}"_\n`;
        txt += `👤 by ${def.author}\n\n`;
      });

      txt += `> *${botFooter}*`;

      await reply(txt);
      await react("✅");
    } catch (e) {
      console.error("Define error:", e);
      await react("❌");
      return reply("Failed to get definition: " + e.message);
    }
  },
);

gmd(
  {
    pattern: "web2zip",
    aliases: ["webtozip", "webdl", "dlweb", "downloadweb"],
    react: "📦",
    category: "tools",
    description: "Download a website as a ZIP file",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      q,
      botFooter,
      botName,
      botPrefix,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    const url = q?.trim();
    if (!url) {
      await react("❌");
      return reply(
        `Please provide a URL\n\nUsage: ${botPrefix}web2zip https://example.com`,
      );
    }

    await react("⏳");

    try {
      const res = await axios.get(`${GiftedTechApi}/api/tools/web2zip`, {
        params: { apikey: GiftedApiKey, url: url },
        responseType: "arraybuffer",
      });

      let domain;
      try {
        domain = new URL(url).hostname.replace(/[^a-z0-9]/gi, "_");
      } catch {
        domain = "website";
      }

      await Gifted.sendMessage(
        from,
        {
          document: Buffer.from(res.data),
          mimetype: "application/zip",
          fileName: `${domain}.zip`,
          caption: `*${botName} WEB2ZIP*\n\n🌐 ${url}\n\n> *${botFooter}*`,
        },
        { quoted: mek },
      );

      await react("✅");
    } catch (e) {
      console.error("Web2zip error:", e);
      await react("❌");
      return reply("Failed to download website: " + e.message);
    }
  },
);

gmd(
  {
    pattern: "emojimix",
    aliases: ["emomix", "mixemoji"],
    react: "😀",
    category: "tools",
    description: "Mix two emojis together",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      q,
      botFooter,
      botName,
      botPrefix,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    const input = q?.trim();
    if (!input) {
      await react("❌");
      return reply(
        `Please provide two emojis\n\nUsage: ${botPrefix}emojimix 😂:🙄\nOr: ${botPrefix}emojimix 😂🙄`,
      );
    }

    let emoji1, emoji2;

    if (input.includes(":")) {
      const parts = input.split(":");
      emoji1 = parts[0].trim();
      emoji2 = parts[1].trim();
    } else {
      const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
      const emojis = input.match(emojiRegex);
      if (emojis && emojis.length >= 2) {
        emoji1 = emojis[0];
        emoji2 = emojis[1];
      }
    }

    if (!emoji1 || !emoji2) {
      await react("❌");
      return reply(`Please provide two valid emojis\n\nUsage: ${botPrefix}emojimix 😂:🙄`);
    }

    await react("⏳");

    try {
      const res = await axios.get(`${GiftedTechApi}/api/tools/emojimix`, {
        params: { apikey: GiftedApiKey, emoji1: emoji1, emoji2: emoji2 },
        responseType: "arraybuffer",
      });

      await Gifted.sendMessage(
        from,
        {
          image: Buffer.from(res.data),
          caption: `*${botName} EMOJI MIX*\n\n${emoji1} + ${emoji2}\n\n> *${botFooter}*`,
        },
        { quoted: mek },
      );

      await react("✅");
    } catch (e) {
      console.error("Emoji mix error:", e);
      await react("❌");
      return reply(
        "Failed to mix emojis. Make sure both emojis are valid and supported.",
      );
    }
  },
);

gmd(
  {
    pattern: "rename",
    aliases: ["newname", "renamefile", "rn"],
    react: "📝",
    category: "tools",
    description: "Rename a quoted document/file with a new name",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      q,
      quoted,
      quotedMsg,
      getMediaBuffer,
      getFileContentType,
      botPrefix,
    } = conText;

    if (!quotedMsg) {
      await react("❌");
      return reply(`Please quote/reply to a document or media file\n\nUsage: ${botPrefix}rename <new filename>`);
    }

    const newName = q?.trim();
    if (!newName) {
      await react("❌");
      return reply(`Please provide a new filename\n\nUsage: ${botPrefix}rename <new filename>\nExample: ${botPrefix}rename my_video.mp4`);
    }

    await react("⏳");

    try {
      let mediaMsg = null;
      let mediaType = null;
      let originalMime = null;
      let originalExt = "";

      if (quotedMsg.documentMessage || quotedMsg.documentWithCaptionMessage?.message?.documentMessage) {
        mediaMsg = quotedMsg.documentMessage || quotedMsg.documentWithCaptionMessage.message.documentMessage;
        mediaType = "document";
        originalMime = mediaMsg.mimetype || "application/octet-stream";
        if (mediaMsg.fileName) {
          const parts = mediaMsg.fileName.split(".");
          if (parts.length > 1) originalExt = "." + parts.pop();
        }
      } else if (quotedMsg.imageMessage) {
        mediaMsg = quotedMsg.imageMessage;
        mediaType = "image";
        originalMime = mediaMsg.mimetype || "image/jpeg";
        originalExt = originalMime.includes("png") ? ".png" : originalMime.includes("gif") ? ".gif" : originalMime.includes("webp") ? ".webp" : ".jpg";
      } else if (quotedMsg.videoMessage) {
        mediaMsg = quotedMsg.videoMessage;
        mediaType = "video";
        originalMime = mediaMsg.mimetype || "video/mp4";
        originalExt = ".mp4";
      } else if (quotedMsg.audioMessage) {
        mediaMsg = quotedMsg.audioMessage;
        mediaType = "audio";
        originalMime = mediaMsg.mimetype || "audio/mpeg";
        originalExt = originalMime.includes("ogg") ? ".ogg" : originalMime.includes("wav") ? ".wav" : ".mp3";
      } else if (quotedMsg.stickerMessage) {
        mediaMsg = quotedMsg.stickerMessage;
        mediaType = "sticker";
        originalMime = "image/webp";
        originalExt = ".webp";
      } else {
        await react("❌");
        return reply("❌ Please quote a document, image, video, audio, or sticker file.");
      }

      const buffer = await getMediaBuffer(mediaMsg, mediaType);

      let finalName = newName;
      if (!finalName.includes(".") && originalExt) {
        finalName = newName + originalExt;
      }

      await Gifted.sendMessage(
        from,
        {
          document: buffer,
          fileName: finalName,
          mimetype: originalMime,
        },
        { quoted: mek }
      );

      await react("✅");
    } catch (e) {
      console.error("Rename error:", e);
      await react("❌");
      return reply("Failed to rename file: " + e.message);
    }
  },
);
