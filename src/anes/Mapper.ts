namespace anes
{
	/*
	 * Mapper Interface.
	 */
	export interface Mapper
	{
		reset(): void
		write(addr: number, src: number): void;
	}
}
