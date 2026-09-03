import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadDir = path.join(
  __dirname,
  '../../uploads'
);

/*
 * Uploadmap automatisch aanmaken
 * als deze nog niet bestaat.
 */
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(
    uploadDir,
    {
      recursive: true
    }
  );
}

/*
 * Alleen deze MIME-types
 * zijn toegestaan.
 *
 * LET OP:
 * MIME-type alleen is niet voldoende
 * als beveiligingscontrole.
 *
 * De echte bestandsinhoud wordt
 * later in FotoController gecontroleerd.
 */
const allowedMimeTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const storage = multer.diskStorage({
  destination: (
    req,
    file,
    cb
  ) => {
    cb(
      null,
      uploadDir
    );
  },

  filename: (
    req,
    file,
    cb
  ) => {
    const extension =
      allowedMimeTypes[file.mimetype];

    if (!extension) {
      cb(
        new Error(
          'Ongeldig bestandstype.'
        ),
        ''
      );

      return;
    }

    /*
     * Cryptografisch willekeurige
     * bestandsnaam.
     *
     * De oorspronkelijke bestandsnaam
     * wordt nooit gebruikt.
     */
    const randomName = crypto
      .randomBytes(16)
      .toString('hex');

    cb(
      null,
      `foto-${randomName}${extension}`
    );
  }
});

const fileFilter: multer.Options['fileFilter'] = (
  req,
  file,
  cb
) => {
  if (
    Object.prototype.hasOwnProperty.call(
      allowedMimeTypes,
      file.mimetype
    )
  ) {
    cb(
      null,
      true
    );

    return;
  }

  cb(
    new Error(
      'Alleen afbeeldingen in JPEG, PNG of WEBP formaat kunnen worden geüpload.'
    )
  );
};

export const upload = multer({
  storage,

  fileFilter,

  limits: {
    /*
     * Maximaal 5 MB per foto.
     */
    fileSize:
      5 *
      1024 *
      1024,

    /*
     * Slechts één bestand.
     */
    files: 1
  }
});