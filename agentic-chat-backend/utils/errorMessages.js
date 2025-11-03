const getErrorMessage = (error, context = 'general') => {
  const errorMessage = error.message || String(error);

  if (context === 'tool') {
    if (errorMessage.includes('Number too large')) {
      return 'The calculation result is too large. Please try a smaller number.';
    }
    if (errorMessage.includes('Invalid calculation')) {
      return 'Invalid calculation. Please check your expression and try again.';
    }
    if (errorMessage.includes('Variables not allowed')) {
      return 'Variables are not allowed in calculations. Please use numeric values only.';
    }
    if (errorMessage.includes('Expression too long')) {
      return 'Expression is too long. Please simplify your calculation.';
    }
    if (errorMessage.includes('timeout')) {
      return 'The operation timed out. Please try again.';
    }
    if (errorMessage.includes('Invalid') || errorMessage.includes('parse')) {
      return 'There was an issue with the calculation or search. Please try rephrasing your question.';
    }
    if (errorMessage.includes('API')) {
      return 'A service is temporarily unavailable. Please try again later.';
    }
    return 'An error occurred while processing your request';
  }

  if (context === 'iteration') {
    if (errorMessage.includes('timeout')) {
      return 'The request timed out. Please try again with a simpler question.';
    }
    if (errorMessage.includes('API') || errorMessage.includes('OPENAI')) {
      return 'The AI service is temporarily unavailable. Please try again later.';
    }
    if (errorMessage.includes('parse') || errorMessage.includes('Invalid')) {
      return 'There was an issue processing your request. Please try rephrasing your question.';
    }
    if (errorMessage.includes('Max iterations')) {
      return 'The request took too long to process. Please try breaking it into smaller questions.';
    }
    return 'An error occurred while processing your request. Please try again.';
  }

  return 'An error occurred while processing your request. Please try again.';
};

module.exports = { getErrorMessage };

