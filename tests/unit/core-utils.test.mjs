import test from 'node:test';
import assert from 'node:assert/strict';
import { secondsToClock } from '../../src/features/exams/runner/utils/examTimer.js';
import { clampPercent } from '../../src/features/video-security/player/utils/progress.js';
import { filterQuestionsByGrade } from '../../src/features/question-bank/utils/questionBankFilters.js';
import { toSafeNumber } from '../../src/shared/core/utils/numberUtils.js';
import { normalizeEgyptPhone, isValidEgyptPhone, validateEgyptianPhones } from '../../src/shared/utils/phone.js';

test('secondsToClock formats invalid and valid values safely', () => {
  assert.equal(secondsToClock(0), '00:00');
  assert.equal(secondsToClock(65), '01:05');
  assert.equal(secondsToClock(-10), '00:00');
  assert.equal(secondsToClock('bad'), '00:00');
});

test('clampPercent normalizes progress values', () => {
  assert.equal(clampPercent(-5), 0);
  assert.equal(clampPercent(49.6), 50);
  assert.equal(clampPercent(150), 100);
  assert.equal(clampPercent('bad'), 0);
});

test('filterQuestionsByGrade returns all or selected grade only', () => {
  const questions = [{ grade: '1' }, { grade: '2' }, { grade: '1' }];
  assert.deepEqual(filterQuestionsByGrade(questions, 'all'), questions);
  assert.deepEqual(filterQuestionsByGrade(questions, '1'), [{ grade: '1' }, { grade: '1' }]);
});

test('toSafeNumber protects calculations from NaN', () => {
  assert.equal(toSafeNumber('12'), 12);
  assert.equal(toSafeNumber('x', 7), 7);
  assert.equal(toSafeNumber(undefined, 3), 3);
});

test('Egypt phone helpers normalize and validate expected formats', () => {
  assert.equal(normalizeEgyptPhone('010-1234-5678'), '01012345678');
  assert.equal(isValidEgyptPhone('01012345678'), true);
  assert.equal(isValidEgyptPhone('01912345678'), false);
  assert.deepEqual(validateEgyptianPhones('01012345678', '01112345678'), {
    ok: true,
    normalizedStudentPhone: '01012345678',
    normalizedParentPhone: '01112345678'
  });
  assert.equal(validateEgyptianPhones('01012345678', '01012345678').ok, false);
});
