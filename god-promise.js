const states = {
  pending: '<pending>',
  fulfilled: '<fulfilled>',
  rejected: '<rejected>'
};
const noop = () => {};
const isThenable = v => v && v.then;

/**
 * this is definitely not fit for production use
 * as it does not cover edge cases.
 * should be used only to understand how a promise works!
 */

class GodPromise {
  constructor (executor) {
    if (typeof executor !== 'function') {
      throw Error('executor must be a function');
    }

    this.$state = states.pending;
    this.$value = undefined;
    this.$reason = undefined;
    this.$thenChain = [];
    this.$finallyChain = [];

    setTimeout(() => {
      try {
        executor(
          this._onResolve.bind(this),
          this._onReject.bind(this)
        );
      } catch (ex) {
        this._onReject(ex);
      }
    });
  }

  then (onResolve, onReject) {
    const promise = new GodPromise(noop); // internal promise

    this.$thenChain.push([promise, onResolve, onReject]);

    return promise;
  }

  catch (onReject) {
    return this.then(undefined, onReject);
  }

  finally (sideEffect) {
    if (this.$state !== states.pending) {
      sideEffect();

      return this.$state = states.fulfilled
      ? GodPromise.reslove(this.$value)
      : GodPromise.reject(this.$reason);
    }

    const promise = new GodPromise(noop); // internal promise

    this.$finallyChain.push([promise, sideEffect]);

    return promise;
  }

  static resolve (value) {
    return new GodPromise(resolve => resolve(value));
  }

  static reject (reason) {
    return new GodPromise((_, reject) => reject(reason));
  }

  // private methods

  _onResolve (value) {
    if (this.$state === states.pending) {
      this.$state = states.fulfilled;
      this.$value = value;
      this._notifyStateChange();
    }
  }

  _onReject (reason) {
    if (this.$state === states.pending) {
      this.$state = states.rejected;
      this.$reason = reason;
      this._notifyStateChange();
    }
  }

  _notifyStateChange () {
    this.$thenChain.forEach(([promise, onResolve, onReject]) => {
      if (this.$state === states.fulfilled) {
        this._applyChange(promise, onResolve, this.$value);
      } else if (this.$state === states.rejected) {
        this._applyChange(promise, onReject, this.$reason);
      }
    });

    this.$finallyChain.forEach(([promise, sideEffect]) => {
      sideEffect();

      if (this.$state === states.fulfilled) {
        promise._onResolve(this.$value);
      } else if (this.$state === states.rejected) {
        promise._onReject(this.$reason);
      }
    });

    this.$thenChain.length = 0;
    this.$finallyChain.length = 0;
  }

  _applyChange (promise, onResolveOrReject, valueOrReason) {
    if (typeof onResolveOrReject === 'function') {
      const promiseOrValue = onResolveOrReject(valueOrReason);

      if (isThenable(promiseOrValue)) {
        promiseOrValue.then(
          value => promise._onResolve(value),
          reason => promise._onReject(reason)
        );
      } else {
        promise._onResolve(promiseOrValue);
      }
    } else if (this.$state === states.fulfilled) {
      promise._onResolve(this.$value);
    } else if (this.$state === states.rejected) {
      promise._onReject(this.$reason);
    }
  }
}

module.exports = GodPromise;
