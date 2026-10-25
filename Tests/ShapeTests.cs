using System.Text.Json;
using System.Text.Json.Serialization;
using Xunit;
using Xunit.Abstractions;

namespace LongIdDemo.Tests;

// Shapes the post leaves out: a nullable ID and a list of IDs. The attribute
// covers both, so no custom converter is needed for them.
public record Child(
    [property: JsonNumberHandling(JsonNumberHandling.WriteAsString | JsonNumberHandling.AllowReadingFromString)]
    long? ParentId,
    [property: JsonNumberHandling(JsonNumberHandling.WriteAsString | JsonNumberHandling.AllowReadingFromString)]
    List<long> TagIds);

public class ShapeTests(ITestOutputHelper output)
{
    private static readonly JsonSerializerOptions Plain = new();

    [Fact]
    public void Nullable_and_list_properties_are_written_as_strings()
    {
        var json = JsonSerializer.Serialize(new Child(1234567890123456789, [1234567890123456789, 7]), Plain);
        output.WriteLine(json);
        Assert.Equal("""{"ParentId":"1234567890123456789","TagIds":["1234567890123456789","7"]}""", json);

        var none = JsonSerializer.Serialize(new Child(null, []), Plain);
        Assert.Equal("""{"ParentId":null,"TagIds":[]}""", none);
    }

    [Fact]
    public void They_read_back_from_strings_with_plain_options()
    {
        var back = JsonSerializer.Deserialize<Child>(
            """{"ParentId":"1234567890123456789","TagIds":["1234567890123456789","7"]}""", Plain)!;
        Assert.Equal(1234567890123456789, back.ParentId);
        Assert.Equal([1234567890123456789L, 7L], back.TagIds);
    }
}
