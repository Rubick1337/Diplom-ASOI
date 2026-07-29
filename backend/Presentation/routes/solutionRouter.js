const Router = require('express');
const router = new Router();
const solutionController = require('../controllers/SolutionController');

router.get('/:id/votes',    solutionController.getVotes);
router.post('/:id/votes',   solutionController.vote);
router.delete('/:id/votes', solutionController.removeVote);

router.get('/:id/comments',                    solutionController.getComments);
router.post('/:id/comments',                   solutionController.addComment);
router.delete('/:id/comments/:commentId',      solutionController.deleteComment);

module.exports = router;
