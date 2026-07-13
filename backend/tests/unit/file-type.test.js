// GO-LIVE-6 B1 — validation d'upload par magic number (contenu), pas par extension/mimetype.
const { detectMagic, assertAllowedUpload } = require('../../src/utils/file-type');

const buf = (...bytes) => Buffer.from(bytes);

describe('file-type — detectMagic (signature réelle du contenu)', () => {
  it('reconnaît un PDF (%PDF)', () => {
    expect(detectMagic(Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.alloc(8)]))).toBe('pdf');
  });
  it('reconnaît un PNG', () => {
    expect(detectMagic(buf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png');
  });
  it('reconnaît un JPEG', () => {
    expect(detectMagic(buf(0xff, 0xd8, 0xff, 0xe0))).toBe('jpg');
  });
  it('reconnaît un ZIP (docx/odt/xlsx)', () => {
    expect(detectMagic(buf(0x50, 0x4b, 0x03, 0x04))).toBe('zip');
  });
  it('reconnaît un OLE (.doc/.xls Office 97-2003)', () => {
    expect(detectMagic(buf(0xd0, 0xcf, 0x11, 0xe0))).toBe('ole');
  });
  it('renvoie null pour un exécutable Windows (MZ)', () => {
    expect(detectMagic(Buffer.concat([Buffer.from('MZ'), Buffer.alloc(8)]))).toBeNull();
  });
  it('renvoie null pour du texte brut', () => {
    expect(detectMagic(Buffer.from('juste du texte'))).toBeNull();
  });
  it('renvoie null pour un buffer trop court', () => {
    expect(detectMagic(buf(0x25))).toBeNull();
  });
});

describe('file-type — assertAllowedUpload (whitelist)', () => {
  it('accepte PDF / PNG / JPG / docx(zip) / doc(ole)', () => {
    expect(assertAllowedUpload(Buffer.from('%PDF-1.4')).ok).toBe(true);
    expect(assertAllowedUpload(buf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)).ok).toBe(true);
    expect(assertAllowedUpload(buf(0xff, 0xd8, 0xff, 0xe0)).ok).toBe(true);
    expect(assertAllowedUpload(buf(0x50, 0x4b, 0x03, 0x04)).ok).toBe(true);
    expect(assertAllowedUpload(buf(0xd0, 0xcf, 0x11, 0xe0)).ok).toBe(true);
  });
  it('REJETTE un .exe (MZ) même renommé .docx', () => {
    const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(1024, 0x90)]);
    expect(assertAllowedUpload(exe).ok).toBe(false);
  });
  it('REJETTE du texte brut renommé .docx', () => {
    expect(assertAllowedUpload(Buffer.from('pas un docx')).ok).toBe(false);
  });
});
