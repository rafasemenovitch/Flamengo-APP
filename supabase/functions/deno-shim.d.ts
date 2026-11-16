/** O mínimo do Deno usado pelas funções, para o tsc do projeto (o Deno real já traz isso). */
declare namespace Deno {
  const env: { get(name: string): string | undefined };
  function serve(handler: (req: Request) => Response | Promise<Response>): unknown;
}
