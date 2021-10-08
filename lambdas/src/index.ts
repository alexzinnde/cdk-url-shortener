import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'
import { PromiseResult } from 'aws-sdk/lib/request'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

enum uuidNameSpace {
  DEFAULT_NAME_SPACE = 'cb745967-5b07-43d9-a251-c261fc2488d9'
}

const getOriginalUrl = async (
  shortUrl: string
): Promise<PromiseResult<AWS.DynamoDB.GetItemOutput, AWS.AWSError>> => {
  console.log('in getOriginalUrl')
  console.log('TABLE_NAME: ', <string>process.env.TABLE_NAME)
  console.log('shortUrl argument: ', shortUrl)

  const db = new AWS.DynamoDB()
  const params: AWS.DynamoDB.GetItemInput = {
    TableName: <string>process.env.TABLE_NAME,
    Key: {
      shortUrl: {
        S: shortUrl
      }
    }
  }
  return db.getItem(params).promise()
}

const shortenUrl = (targetUrl: string): string => {
  console.log('in shrotenUrl')
  return uuid.v5(targetUrl, uuidNameSpace.DEFAULT_NAME_SPACE).substring(0, 6)
}

const saveShortUrl = async (
  targetUrl: string,
  shortUrl: string
): Promise<PromiseResult<AWS.DynamoDB.PutItemOutput, AWS.AWSError>> => {
  console.log('in saveShortUrl')
  console.log('TABLE_NAME: ', <string>process.env.TABLE_NAME)
  const db = new AWS.DynamoDB()
  const params: AWS.DynamoDB.PutItemInput = {
    TableName: <string>process.env.TABLE_NAME,
    Item: {
      shortUrl: {
        S: shortUrl
      },
      url: {
        S: targetUrl
      }
    }
  }
  console.log('params: ', JSON.stringify(params, null, 2))
  return db.putItem(params).promise()
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult | AWS.AWSError> => {
  console.log('in handler. Event: ', JSON.stringify(event, null, 2))
  console.log(
    'event.queryStringParameters: ',
    JSON.stringify(event.queryStringParameters, null, 2)
  )
  try {
    if (event.queryStringParameters) {
      const { targetUrl } = event.queryStringParameters
      console.log('targetUrl: ', targetUrl)
      if (targetUrl) {
        // shorten URL and return shortened Version
        const shortUrl = shortenUrl(targetUrl)
        await saveShortUrl(targetUrl, shortUrl)
        return {
          statusCode: 200,
          body: `<html><h2>Shortened URL</h2><p>${shortUrl}</p></html>`
        }
      } else {
        return {
          statusCode: 400,
          body: 'incorrect query param'
        }
      }
    }

    if (event.path) {
      const shortUrl = event.path.substring(1)
      const orgUrlRec = await getOriginalUrl(shortUrl)
      console.log('in handler -> orgUrlRec: ', JSON.stringify(orgUrlRec))
      if (orgUrlRec.Item?.url) {
        console.log('body: ', orgUrlRec.Item.url.S)
        return {
          statusCode: 301,
          headers: {
            Location: orgUrlRec.Item.url.S as string
          },
          body: `Redirecting to: ${orgUrlRec.Item.url.S as string}`
        }
      }
    }
  } catch (err) {
    console.log('Catch Error: ', JSON.stringify(err, null, 2))
    return {
      statusCode: 500,
      body: 'Something went wrong' + JSON.stringify(err, null, 2)
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html'
    },
    body: '<html><h1>Hello From Handler</h1></html>'
  }
}
