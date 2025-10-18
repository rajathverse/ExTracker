const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const EXPENSES_TABLE = process.env.EXPENSES_TABLE;

// Helper to get userId from Cognito token
const getUserId = (event) => {
  return event.requestContext.authorizer.claims.sub;
};

// Helper for CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

// GET /expenses - Get all expenses for user
module.exports.getExpenses = async (event) => {
  try {
    const userId = getUserId(event);
    const monthKey = event.queryStringParameters?.monthKey;

    let params = {
      TableName: EXPENSES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    // If monthKey provided, filter by month
    if (monthKey) {
      params.IndexName = 'monthKeyIndex';
      params.KeyConditionExpression = 'userId = :userId AND monthKey = :monthKey';
      params.ExpressionAttributeValues[':monthKey'] = monthKey;
    }

    const result = await dynamodb.query(params).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        expenses: result.Items
      })
    };
  } catch (error) {
    console.error('Error getting expenses:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to get expenses',
        error: error.message
      })
    };
  }
};

// POST /expenses - Add new expense
module.exports.addExpense = async (event) => {
  try {
    const userId = getUserId(event);
    const body = JSON.parse(event.body);

    const expense = {
      userId,
      expenseId: uuidv4(),
      monthKey: body.monthKey,
      category: body.category,
      where: body.where,
      amount: body.amount,
      dueDate: body.dueDate,
      isPaid: body.isPaid || false,
      paidAmount: body.paidAmount || 0,
      commitment: body.commitment || '',
      isRecurring: body.isRecurring || false,
      emiPaid: body.emiPaid || 0,
      emiTotal: body.emiTotal || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: EXPENSES_TABLE,
      Item: expense
    }).promise();

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        expense
      })
    };
  } catch (error) {
    console.error('Error adding expense:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to add expense',
        error: error.message
      })
    };
  }
};

// PUT /expenses/{id} - Update expense
module.exports.updateExpense = async (event) => {
  try {
    const userId = getUserId(event);
    const expenseId = event.pathParameters.id;
    const body = JSON.parse(event.body);

    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Build dynamic update expression
    Object.keys(body).forEach((key, index) => {
      if (key !== 'userId' && key !== 'expenseId') {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpression.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = body[key];
      }
    });

    // Always update updatedAt
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await dynamodb.update({
      TableName: EXPENSES_TABLE,
      Key: { userId, expenseId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Expense updated successfully'
      })
    };
  } catch (error) {
    console.error('Error updating expense:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to update expense',
        error: error.message
      })
    };
  }
};

// DELETE /expenses/{id} - Delete expense
module.exports.deleteExpense = async (event) => {
  try {
    const userId = getUserId(event);
    const expenseId = event.pathParameters.id;

    await dynamodb.delete({
      TableName: EXPENSES_TABLE,
      Key: { userId, expenseId }
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Expense deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to delete expense',
        error: error.message
      })
    };
  }
};
