module.exports = function responseEnvelopeMiddleware(req, res, next) {
	res.success = function successResponse(myData = null, message = 'ok', status = 200) {
		return res.status(status).json({ message, variant: 'success', myData });
	};
	res.errorEnvelope = function errorResponse(message = 'error', status = 400, myData = null) {
		return res.status(status).json({ message, variant: 'error', myData });
	};
	return next();
};



