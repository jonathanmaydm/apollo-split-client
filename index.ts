import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { ApolloLink, split } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';

interface IDefinintion {
  kind: string;
  operation?: string;
}

class ApolloSplitClient {
  client: any;
  constructor(httpUri: string, wsUri?: string) {
    function buildSplit(
      httpLink: HttpLink,
      wsLink?: WebSocketLink
    ): ApolloLink {
      if (wsLink) {
        return split(
          ({ query }) => {
            const { kind, operation }: IDefinintion = getMainDefinition(query);
            return (
              kind === 'OperationDefinition' && operation === 'subscription'
            );
          },
          wsLink,
          httpLink
        );
      }
      return httpLink;
    }

    const httpLink = new HttpLink({
      uri: httpUri
    });

    const wsLink = wsUri
      ? new WebSocketLink({
          options: {
            reconnect: true
          },
          uri: wsUri
        })
      : undefined;

    const link = buildSplit(httpLink, wsLink);

    this.client = new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.from([
        onError(({ graphQLErrors, networkError }) => {
          if (graphQLErrors) {
            graphQLErrors.map(({ message, locations, path }) =>
              console.log(
                `[GraphQL Error]: Message: ${message}, Location: ${locations}, Path: ${path}`
              )
            );
          }
          if (networkError) {
            console.log(`[Network Error]: ${networkError}`);
          }
        }),
        link
      ])
    });
  }
}

export default ApolloSplitClient;
