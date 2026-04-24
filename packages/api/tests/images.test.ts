import { validateAndProcessImage } from '../src/services/imageValidation';

describe('image validation', () => {
  it('rejects unsupported mime type', async () => {
    await expect(
      validateAndProcessImage({
        buffer: Buffer.from('abc'),
        mimetype: 'application/pdf',
        size: 10,
      } as any),
    ).rejects.toThrow('Invalid image type');
  });
});
