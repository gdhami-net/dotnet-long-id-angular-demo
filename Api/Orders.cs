using System.Text.Json.Serialization;

namespace LongIdDemo.Api;

// The same order, shaped twice. RawOrder is what you get by default: the long
// goes out as a JSON number. Order is the fix: the ID is a string on the wire,
// and a string is accepted on the way back in.
public record RawOrder(long Id, string Customer, decimal Total);

public record Order(
    [property: JsonNumberHandling(
        JsonNumberHandling.WriteAsString | JsonNumberHandling.AllowReadingFromString)]
    long Id,
    string Customer,
    decimal Total);

public static class Store
{
    // A snowflake-style ID (far above 2^53) and a small identity-style one.
    public const long BigId = 1234567890123456789;
    public const long SmallId = 42;

    public static readonly IReadOnlyList<RawOrder> All =
    [
        new(BigId, "Snowflake Ltd", 19.99m),
        new(SmallId, "Identity Co", 5.50m),
    ];

    public static RawOrder? Find(long id) => All.FirstOrDefault(o => o.Id == id);

    public static Order ToOrder(RawOrder o) => new(o.Id, o.Customer, o.Total);
}
