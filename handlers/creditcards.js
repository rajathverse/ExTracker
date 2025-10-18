const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const CREDIT_CARDS_TABLE = process.env.CREDIT_CARDS_TABLE;

const getUserId = (event) => {
  return event.requestContext.authorizer.claims.sub;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

// GET /creditcards
module.exports.getCreditCards = async (event) => {
  try {
    const userId = getUserId(event);

    const result = await dynamodb.query({
      TableName: CREDIT_CARDS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        creditCards: result.Items
      })
    };
  } catch (error) {
    console.error('Error getting credit cards:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to get credit cards',
        error: error.message
      })
    };
  }
};

// POST /creditcards
module.exports.addCreditCard = async (event) => {
  try {
    const userId = getUserId(event);
    const body = JSON.parse(event.body);

    const creditCard = {
      userId,
      cardId: uuidv4(),
      name: body.name,
      limit: body.limit,
      outstanding: body.outstanding || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: CREDIT_CARDS_TABLE,
      Item: creditCard
    }).promise();

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        creditCard
      })
    };
  } catch (error) {
    console.error('Error adding credit card:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to add credit card',
        error: error.message
      })
    };
  }
};

// PUT /creditcards/{id}
module.exports.updateCreditCard = async (event) => {
  try {
    const userId = getUserId(event);
    const cardId = event.pathParameters.id;
    const body = JSON.parse(event.body);

    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(body).forEach((key, index) => {
      if (key !== 'userId' && key !== 'cardId') {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpression.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = body[key];
      }
    });

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await dynamodb.update({
      TableName: CREDIT_CARDS_TABLE,
      Key: { userId, cardId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Credit card updated successfully'
      })
    };
  } catch (error) {
    console.error('Error updating credit card:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to update credit card',
        error: error.message
      })
    };
  }
};

// DELETE /creditcards/{id}
module.exports.deleteCreditCard = async (event) => {
  try {
    const userId = getUserId(event);
    const cardId = event.pathParameters.id;

    await dynamodb.delete({
      TableName: CREDIT_CARDS_TABLE,
      Key: { userId, cardId }
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Credit card deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error deleting credit card:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to delete credit card',
        error: error.message
      })
    };
  }
};
