const Router  = require('express');
const router  = new Router();
const multer  = require('multer');
const testController = require('../controllers/testController');
const { questionImageUpload } = require('../../Data/config/uploadConfig');

// multer в памяти — XML-файл не нужно сохранять на диск
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── Типы вопросов (публичный справочник) ──────────────────────────────────────
router.get('/question-types', testController.getQuestionTypes);

// ── Запуск кода вопроса ───────────────────────────────────────────────────────
router.post('/run-code',         testController.runCode);
router.post('/run-code-preview', testController.previewCode);

// ── Пользователь: список и прохождение ───────────────────────────────────────
router.get('/',                           testController.getPublishedTests);
router.get('/:id',                        testController.getPublishedTest);
router.post('/:id/start',                 testController.startAttempt);
router.post('/attempts/:attemptId/submit',testController.submitAttempt);
router.get('/:id/my-attempts',            testController.getMyAttempts);
router.get('/attempts/:attemptId/result', testController.getAttemptResult);
router.get('/:id/report-reasons',         testController.getReportReasons);
router.post('/:id/report',                testController.createReport);
router.get('/:id/reviews',                testController.getReviews);
router.post('/:id/reviews',               testController.createReview);

// ── Админ: управление тестами ─────────────────────────────────────────────────
router.get   ('/admin/tests',             testController.getAdminTests);
router.post  ('/admin/tests',             testController.createTest);
router.get   ('/admin/tests/:id',         testController.getAdminTest);
router.put   ('/admin/tests/:id',         testController.updateTest);
router.patch ('/admin/tests/:id/publish', testController.publishTest);
router.delete('/admin/tests/:id',         testController.deleteTest);

// ── Админ: управление вопросами ───────────────────────────────────────────────
router.post  ('/admin/tests/:id/questions',              testController.createQuestion);
router.put   ('/admin/tests/:id/questions/:questionId',  testController.updateQuestion);
router.delete('/admin/tests/:id/questions/:questionId',  testController.deleteQuestion);
router.patch ('/admin/tests/:id/questions/reorder',      testController.reorderQuestions);

// ── Moodle ZIP экспорт / XML импорт ──────────────────────────────────────────
router.get  ('/admin/tests/:id/export',                  testController.exportMoodle);
router.post ('/admin/tests/import', upload.single('file'), testController.importMoodle);

// ── Изображения вопросов ──────────────────────────────────────────────────────
router.post  ('/admin/questions/:questionId/image', questionImageUpload.single('image'), testController.uploadQuestionImage);
router.delete('/admin/questions/:questionId/image', testController.deleteQuestionImage);

// ── Quiz API импорт ───────────────────────────────────────────────────────────
router.post ('/admin/tests/import-quiz',                 testController.importQuizApi);

module.exports = router;
