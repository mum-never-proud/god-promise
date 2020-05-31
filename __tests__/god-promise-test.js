import GodPromise from '../god-promise';

describe('GodPromise', () => {
  it('should throw error when executor is not a function', () => {
    expect(() => new GodPromise()).toThrowError(Error);
  });

  it('should not execute catch on resolve', (done) => {
    const thenFn = jest.fn();
    const catchFn = jest.fn();

    new GodPromise((resolve) => setTimeout(resolve, 100))
      .then(() => thenFn())
      .catch(() => catchFn())
      .finally(() => {
        expect(thenFn).toHaveBeenCalled();
        expect(catchFn).not.toHaveBeenCalled();
        done();
      });
  });

  it('should not execute then on reject', (done) => {
    const thenFn = jest.fn();
    const catchFn = jest.fn();

    new GodPromise((_, reject) => setTimeout(reject, 100))
      .then(() => thenFn())
      .catch(() => catchFn())
      .finally(() => {
        expect(thenFn).not.toHaveBeenCalled();
        expect(catchFn).toHaveBeenCalled();
        done();
      });
  });

  it('should execute finally irrespective of resolve or reject', (done) => {
    const thenFn = jest.fn();
    const catchFn = jest.fn();
    const finallyFn = jest.fn();

    new GodPromise((resolve) => setTimeout(resolve, 100))
      .then(() => thenFn())
      .catch(() => catchFn())
      .finally(() => finallyFn())
      .finally(() => expect(finallyFn).toHaveBeenCalled());

    new GodPromise((_, reject) => setTimeout(reject, 100))
      .then(() => thenFn())
      .catch(() => catchFn())
      .finally(() => finallyFn())
      .finally(() => {
        expect(finallyFn).toHaveBeenCalledTimes(2);
        done();
      });
  });

  it('should pass on the value to thenables', (done) => {
    new GodPromise((resolve) => resolve(42))
      .then((v) => v + 1)
      .then((v) => v + 2)
      .then((v) => {
        expect(v).toEqual(45);
        done();
      });
  });

  it('should wait for GodPromise in thenables', (done) => {
    new GodPromise((resolve) => resolve(42))
      .then((v) => GodPromise.resolve(v + 1))
      .then((v) => v + 2)
      .then((v) => {
        expect(v).toEqual(45);
        done();
      });
  });

  it('should reject if GodPromise in thenables is rejected', (done) => {
    const thenFn = jest.fn();
    const catchFn = jest.fn();

    new GodPromise((resolve) => resolve(42))
      .then((v) => GodPromise.reject(v + 1))
      .then(() => thenFn())
      .catch(() => catchFn())
      .finally(() => {
        expect(thenFn).not.toHaveBeenCalled();
        expect(catchFn).toHaveBeenCalled();
        done();
      });
  });
});
