import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as UrlShortener2 from '../lib/url-shortener2-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new UrlShortener2.UrlShortener2Stack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
