import { KingWorld, t } from '../src'

import { describe, expect, it } from 'bun:test'
const req = (path: string) => new Request(path)

describe('Transform', () => {
	it('Globally Transform', async () => {
		const app = new KingWorld()
			.onTransform<{
				params: {
					id?: number
				}
			}>((request) => {
				if (request.params?.id) request.params.id = +request.params.id
			})
			.get('/id/:id', ({ params: { id } }) => typeof id)
		const res = await app.handle(req('/id/1'))

		expect(await res.text()).toBe('number')
	})

	it('Locally transform', async () => {
		const app = new KingWorld().get(
			'/id/:id',
			({ params: { id } }) => typeof id,
			{
				transform: (request) => {
					if (request.params?.id)
						request.params.id = +request.params.id
				},
				schema: {
					params: t.Object({
						id: t.Number()
					})
				}
			}
		)
		const res = await app.handle(req('/id/1'))

		expect(await res.text()).toBe('number')
	})

	it('Group transform', async () => {
		const app = new KingWorld()
			.group('/scoped', (app) =>
				app
					.onTransform<{
						params: {
							id?: number
						}
					}>((request) => {
						if (request.params?.id)
							request.params.id = +request.params.id
					})
					.get('/id/:id', ({ params: { id } }) => typeof id)
			)
			.get('/id/:id', ({ params: { id } }) => typeof id)

		const base = await app.handle(req('/id/1'))
		const scoped = await app.handle(req('/scoped/id/1'))

		expect(await base.text()).toBe('string')
		expect(await scoped.text()).toBe('number')
	})

	it('Transform from plugin', async () => {
		const transformId = (app: KingWorld) =>
			app.onTransform<{
				params: {
					id?: number
				}
			}>((request) => {
				if (request.params?.id) request.params.id = +request.params.id
			})

		const app = new KingWorld()
			.use(transformId)
			.get('/id/:id', ({ params: { id } }) => typeof id)

		const res = await app.handle(req('/id/1'))

		expect(await res.text()).toBe('number')
	})

	it('Transform from on', async () => {
		const app = new KingWorld()
			.on('transform', (request) => {
				if (request.params?.id) request.params.id = +request.params.id
			})
			.get('/id/:id', ({ params: { id } }) => typeof id)

		const res = await app.handle(req('/id/1'))

		expect(await res.text()).toBe('number')
	})

	it('Transform in order', async () => {
		const app = new KingWorld()
			.get('/id/:id', ({ params: { id } }) => typeof id)
			.onTransform<{
				params: {
					id?: number
				}
			}>((request) => {
				if (request.params?.id) request.params.id = +request.params.id
			})

		const res = await app.handle(req('/id/1'))

		expect(await res.text()).toBe('string')
	})

	it('Globally and locally pre handle', async () => {
		const app = new KingWorld()
			.onTransform<{
				params: {
					id?: number
				}
			}>((request) => {
				if (request.params?.id) request.params.id = +request.params.id
			})
			.get('/id/:id', ({ params: { id } }) => id, {
				schema: {
					params: t.Object({
						id: t.Number()
					})
				},
				transform: (request) => {
					if (
						request.params?.id &&
						typeof request.params?.id === 'number'
					)
						request.params.id = request.params.id + 1
				}
			})

		const res = await app.handle(req('/id/1'))

		expect(await res.text()).toBe('2')
	})

	it('Accept multiple transform', async () => {
		const app = new KingWorld()
			.onTransform<{
				params: {
					id?: number
				}
			}>((request) => {
				if (request.params?.id) request.params.id = +request.params.id
			})
			.onTransform<{
				params: {
					id?: number
				}
			}>((request) => {
				if (
					request.params?.id &&
					typeof request.params?.id === 'number'
				)
					request.params.id = request.params.id + 1
			})
			.get('/id/:id', ({ params: { id } }) => id)

		const res = await app.handle(req('/id/1'))

		expect(await res.text()).toBe('2')
	})

	it('Transform async', async () => {
		const app = new KingWorld().get(
			'/id/:id',
			({ params: { id } }) => typeof id,
			{
				schema: {
					params: t.Object({
						id: t.Number()
					})
				},
				transform: async (request) => {
					await new Promise<void>((resolve) =>
						setTimeout(() => {
							resolve()
						}, 1)
					)

					if (request.params?.id)
						request.params.id = +request.params.id
				}
			}
		)

		const res = await app.handle(req('/id/1'))

		expect(await res.text()).toBe('number')
	})
})
