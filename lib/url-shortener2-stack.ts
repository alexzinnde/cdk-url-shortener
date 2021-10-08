import * as cdk from '@aws-cdk/core'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as lambda from '@aws-cdk/aws-lambda'
import * as apigw from '@aws-cdk/aws-apigateway'

export class UrlShortener2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    //Define the resources

    //DynamoDB
    const table = new dynamodb.Table(this, 'az-shortener', {
      partitionKey: {
        name: 'shortUrl',
        type: dynamodb.AttributeType.STRING
      }
    })

    //Lambda
    const handler = new lambda.Function(this, 'shortner-handler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'src/index.handler',
      code: lambda.Code.fromAsset('lambdas'),
      environment: {
        TABLE_NAME: table.tableName
      }
    })
    table.grantReadWriteData(handler)

    const api = new apigw.LambdaRestApi(this, 'url-shorten2-endpoint', {
      handler: handler
    })

  }
}
