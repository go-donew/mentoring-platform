-- scripts/example
-- An example script that calculates the score of a user in a quiz.

-- The computation of the attribute must be done in a `compute` function, that
-- is called with context.
function compute(context)
	-- The `context.input` variable contains the attributes requested as script as
	-- input. If the input attribute is required and not present, the script will
	-- not be run, so you can safely assume that the attribute exists. If the attribute
	-- is optional, it may or may not exist, please do a null check before using it.
	-- context.input.<attributeId> = { id, value, history, _userId }

	-- The `context.user` variable contains information about the current user (name,
	-- email, user ID, etc.) that you can use:
	-- context.user = { id, name, email, phone, lastSignedIn }
	
	-- The smartness can be calculated by taking the average of their scores
	-- in the quiz.
	knowsCleanestCity = context.input.["{knowsCleanestCity}"].value
	knowsCapitalCity = context.input.["{knowsCapitalCity}"].value
	quizScore = (knowsCapitalCity + knowsCleanestCity) / 2

	-- The returned object must be a lua table containing the user attributes to set.
	-- The attributes will be set on the user passed in as `context.user`. You must
	-- specify the value to set as well as the message it was observed in, if any.
	return {
		attributes = {
			"{smartness}" = {
				value = quizScore,
				message = nil,
			}
		}
	}
end
